import { CreemGateway } from "./providers/creem";
import { BillingError } from "./errors";
import { PLAN_OFFERS, type ActiveOfferId } from "./types";
export * from "./types";
export * from "./providers/creem";

const bindings: Record<ActiveOfferId,string> = {
  starter: "CREEM_PRODUCT_STARTER", "pro-month": "CREEM_PRODUCT_PRO_MONTH",
  "pro-year": "CREEM_PRODUCT_PRO_YEAR",
};
export function getProductBinding(offerId: string): string {
  if (!Object.hasOwn(PLAN_OFFERS,offerId)) throw new BillingError("INVALID_OFFER","Unknown offer.",400);
  const id = process.env[bindings[offerId as ActiveOfferId]]?.trim();
  if (!id || !/^prod_[a-zA-Z0-9]+$/.test(id)) throw new BillingError("BILLING_NOT_CONFIGURED","This offer is not configured.");
  return id;
}
export function getPaymentGateway() { return new CreemGateway(); }
