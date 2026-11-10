import { createHmac, timingSafeEqual } from "node:crypto";
import { BillingError } from "../errors";
import type { PlanOffer } from "../types";

export type ProviderObject = Record<string, unknown>;
export function object(value: unknown): ProviderObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BillingError("INVALID_PROVIDER_DATA","Payment evidence is invalid.",502);
  return value as ProviderObject;
}
export function providerId(value: unknown): string {
  const id = typeof value === "string" ? value : value && typeof value === "object" ? (value as ProviderObject).id : null;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new BillingError("INVALID_PROVIDER_DATA","Payment reference is invalid.",502);
  return id;
}
export function verifyCreemSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!secret.trim() || !signature || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature,"hex"), createHmac("sha256",secret).update(rawBody).digest());
}
export function validateCheckoutUrl(value: unknown): string {
  if (typeof value !== "string") throw new BillingError("INVALID_CHECKOUT_URL","Payment provider did not return a checkout URL.",502);
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !["creem.io","www.creem.io","checkout.creem.io","test-checkout.creem.io"].includes(url.hostname)) {
    throw new BillingError("INVALID_CHECKOUT_URL","Payment provider returned an invalid checkout URL.",502);
  }
  return url.href;
}
export class CreemGateway {
  readonly name = "creem";
  readonly environment: "test" | "live";
  private baseUrl: string;
  constructor(environment = process.env.CREEM_ENVIRONMENT, private apiKey = process.env.CREEM_API_KEY ?? "",
    private webhookSecret = process.env.CREEM_WEBHOOK_SECRET ?? "") {
    if ((environment !== "test" && environment !== "live") || !apiKey.trim() || !webhookSecret.trim()) {
      throw new BillingError("BILLING_NOT_CONFIGURED","Payments are not configured. Please contact the site owner.");
    }
    this.environment = environment;
    this.baseUrl = environment === "live" ? "https://api.creem.io" : "https://test-api.creem.io";
  }
  private async request(path: string, body?: ProviderObject): Promise<ProviderObject> {
    const response = await fetch(this.baseUrl + path, {
      method: body ? "POST" : "GET", headers: { "x-api-key": this.apiKey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new BillingError("PROVIDER_UNAVAILABLE","The payment provider is unavailable. Please try again.",502);
    return object(await response.json());
  }
  assertMode(data: ProviderObject) {
    if (data.mode !== (this.environment === "live" ? "prod" : "test") && !(this.environment === "test" && data.mode === "sandbox")) {
      throw new BillingError("PAYMENT_MODE_MISMATCH","Payment environment does not match.",502);
    }
  }
  async validateProduct(productId: string, offer: PlanOffer) {
    const product = await this.request(`/v1/products/${encodeURIComponent(productId)}`);
    this.assertMode(product);
    if (product.id !== productId || product.status !== "active" || product.price !== offer.amountCents || product.currency !== "USD" ||
      Number(product.trial_period_days ?? 0) !== 0 || Number(product.recurring_interval_count ?? 1) !== 1 ||
      product.billing_type !== offer.billingType || (offer.billingType === "recurring" && product.billing_period !== (offer.billingPeriod === "monthly" ? "every-month" : "every-year"))) {
      throw new BillingError("PRODUCT_MISMATCH","The payment product does not match the advertised offer.");
    }
    return product;
  }
  async createCheckout(input: { orderId: string; productId: string; offerId: string; customerEmail: string; successUrl: string }) {
    const data = await this.request("/v1/checkouts", {
      request_id: input.orderId, product_id: input.productId, units: 1, success_url: input.successUrl,
      customer: { email: input.customerEmail }, metadata: { orderId: input.orderId, offerId: input.offerId },
    });
    this.assertMode(data);
    const id = providerId(data.id);
    const checkout = data.request_id == null ? await this.getCheckout(id) : data;
    if (checkout.request_id !== input.orderId || providerId(checkout.product ?? checkout.product_id) !== input.productId || checkout.status !== "pending" ||
      providerId(data.product ?? data.product_id) !== input.productId || data.status !== "pending") {
      throw new BillingError("CHECKOUT_MISMATCH","The payment provider returned an inconsistent checkout.",502);
    }
    return { id, url: validateCheckoutUrl(data.checkout_url) };
  }
  async getCheckout(id: string) {
    const data = await this.request(`/v1/checkouts?checkout_id=${encodeURIComponent(id)}`);
    this.assertMode(data);
    if (data.id !== id) throw new BillingError("CHECKOUT_MISMATCH","Checkout reference does not match.",502);
    return data;
  }
  async getTransaction(id: string) {
    const data = await this.request(`/v1/transactions?transaction_id=${encodeURIComponent(id)}`);
    this.assertMode(data);
    if (data.id !== id) throw new BillingError("TRANSACTION_MISMATCH","Transaction reference does not match.",502);
    return data;
  }
  async getSubscription(id: string) {
    const data = await this.request(`/v1/subscriptions?subscription_id=${encodeURIComponent(id)}`);
    this.assertMode(data);
    if (data.id !== id) throw new BillingError("SUBSCRIPTION_MISMATCH","Subscription reference does not match.",502);
    return data;
  }
  async customerPortal(customerId: string) {
    const data = await this.request("/v1/customers/billing", { customer_id: customerId });
    return validateCheckoutUrl(data.customer_portal_link);
  }
  verifyWebhook(body: string, signature: string | null) { return verifyCreemSignature(body,signature,this.webhookSecret); }
}
