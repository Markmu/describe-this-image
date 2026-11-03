import { randomUUID } from "node:crypto";
import { getBillingPool, lockOwner, transaction } from "./db";
import { getPaymentGateway, getProductBinding, PLAN_OFFERS } from "./index";
import { BillingError } from "./errors";
import { appOrigin, signReturnState } from "./callback";
import type { ActiveOfferId } from "./types";

export type BillingOrder = {
  id: string; user_id: string; offer_id: string; product_id: string; environment: string;
  amount_cents: number; currency: string; checkout_id: string | null; checkout_url: string | null;
  customer_id: string | null; subscription_id: string | null; status: string;
};
export async function getOwnedOrder(id: string, userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new BillingError("ORDER_NOT_FOUND", "Order was not found.",404);
  }
  const { rows: [order] } = await getBillingPool().query<BillingOrder>("SELECT * FROM billing_orders WHERE id=$1 AND user_id=$2", [id,userId]);
  if (!order) throw new BillingError("ORDER_NOT_FOUND", "Order was not found.",404);
  return order;
}
export async function createOrder(userId: string, email: string, offerId: string) {
  if (!Object.hasOwn(PLAN_OFFERS,offerId)) throw new BillingError("INVALID_OFFER", "Unknown offer.",400);
  const offer = PLAN_OFFERS[offerId as ActiveOfferId];
  const gateway = getPaymentGateway();
  const productId = getProductBinding(offerId);
  const id = randomUUID();
  const success = new URL("/billing/success", appOrigin());
  success.searchParams.set("local_order_id",id);
  success.searchParams.set("state",signReturnState(id,userId));
  await gateway.validateProduct(productId,offer);
  const resumed = await transaction(async db => {
    await lockOwner(db,`user:${userId}`);
    const { rows: [count] } = await db.query("SELECT count(*)::int AS n FROM billing_orders WHERE user_id=$1 AND created_at > now() - interval '1 hour'", [userId]);
    if (count.n >= 5) throw new BillingError("CHECKOUT_LIMIT", "Please wait before starting another checkout.",429);
    if (offer.billingType === "recurring") {
      const active = await db.query("SELECT id FROM billing_subscriptions WHERE user_id=$1 AND paid_through>now() AND status IN ('active','scheduled_cancel','canceled')",[userId]);
      if (active.rowCount) throw new BillingError("SUBSCRIPTION_EXISTS", "You have a paid subscription. Contact support to change plans.",409);
      const { rows: [pending] } = await db.query<BillingOrder>("SELECT * FROM billing_orders WHERE user_id=$1 AND offer_id IN ('pro-month','pro-year') AND status='pending' AND created_at>now()-interval '24 hours' ORDER BY created_at DESC LIMIT 1",[userId]);
      if (pending) {
        if (pending.checkout_id && pending.checkout_url) {
          const previous = await gateway.getCheckout(pending.checkout_id);
          if (previous.status === "expired") await db.query("UPDATE billing_orders SET status='failed' WHERE id=$1",[pending.id]);
          else if (pending.offer_id === offerId && previous.status === "pending") return {checkoutUrl:pending.checkout_url,orderId:pending.id};
          else throw new BillingError("CHECKOUT_PENDING","A Pro payment is pending. Return to that checkout or wait for confirmation before changing plans.",409);
        } else throw new BillingError("CHECKOUT_PENDING","A Pro checkout is awaiting reconciliation. Please try again later or check your Creem receipt.",409);
      }
    }
    await db.query(`INSERT INTO billing_orders(id,user_id,offer_id,product_id,environment,amount_cents)
      VALUES ($1,$2,$3,$4,$5,$6)`, [id,userId,offerId,productId,gateway.environment,offer.amountCents]);
  });
  if (resumed) return resumed;
  const checkout = await gateway.createCheckout({ orderId:id, productId, offerId, customerEmail:email, successUrl:success.href });
  await getBillingPool().query("UPDATE billing_orders SET checkout_id=$2,checkout_url=$3 WHERE id=$1 AND (checkout_id IS NULL OR checkout_id=$2)",[id,checkout.id,checkout.url]);
  return { checkoutUrl: checkout.url, orderId:id };
}
