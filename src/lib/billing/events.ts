import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { getBillingPool, lockOwner, transaction } from "./db";
import { BillingError } from "./errors";
import { getPaymentGateway, getOrderOffer } from "./index";
import type { BillingOrder } from "./orders";
import { object, providerId, type CreemGateway, type ProviderObject } from "./providers/creem";
import { grantCredits } from "./usage";

function requireEvidence(condition: unknown): asserts condition {
  if (!condition) throw new BillingError("PAYMENT_EVIDENCE_MISMATCH", "Payment evidence does not match the order.", 409);
}
function date(value: unknown) {
  const result = new Date(typeof value === "number" ? (value < 1e12 ? value * 1000 : value) : String(value));
  requireEvidence(Number.isFinite(result.getTime()));
  return result;
}
export function monthBoundary(start: Date, months: number) {
  const result = new Date(start);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const last = new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate();
  result.setUTCDate(Math.min(start.getUTCDate(),last));
  return result;
}
async function localOrder(id: unknown) {
  requireEvidence(typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
  const { rows: [order] } = await getBillingPool().query<BillingOrder>("SELECT * FROM billing_orders WHERE id=$1",[id]);
  if (!order) throw new BillingError("ORDER_NOT_READY","Payment order is not available yet.",503);
  return order;
}
async function checkoutEvidence(gateway: CreemGateway, checkout: ProviderObject) {
  const order = await localOrder(checkout.request_id);
  requireEvidence(order.environment === gateway.environment && checkout.status === "completed"
    && providerId(checkout.product) === order.product_id && Number(checkout.units ?? 1) === 1
    && (!order.checkout_id || order.checkout_id === checkout.id));
  return order;
}
type Evidence = { order: BillingOrder; checkout?: ProviderObject; subscription?: ProviderObject; payment?: ProviderObject; revoke?: boolean };

async function collectEvidence(type: string, data: ProviderObject, gateway: CreemGateway): Promise<Evidence | null> {
  if (type === "checkout.completed") {
    const checkout = await gateway.getCheckout(providerId(data.id));
    const order = await checkoutEvidence(gateway,checkout);
    const offer = getOrderOffer(order.offer_id);
    requireEvidence(offer);
    if (offer.billingType === "recurring") return { order, checkout };
    const receipt = object(checkout.order);
    const payment = await gateway.getTransaction(providerId(receipt.transaction));
    requireEvidence(providerId(payment.order) === providerId(receipt.id));
    return { order, checkout, payment };
  }
  if (type.startsWith("subscription.")) {
    const subscription = await gateway.getSubscription(providerId(data.id));
    const { rows: [known] } = await getBillingPool().query<BillingOrder>(
      "SELECT o.* FROM billing_orders o WHERE subscription_id=$1",[subscription.id]);
    const order = known ?? await localOrder(object(subscription.metadata).orderId);
    requireEvidence(order.checkout_id);
    const checkout = await gateway.getCheckout(order.checkout_id);
    const bound = await checkoutEvidence(gateway,checkout);
    requireEvidence(bound.id === order.id && providerId(checkout.subscription) === subscription.id
      && providerId(subscription.product) === order.product_id
      && providerId(subscription.customer) === providerId(checkout.customer));
    const payment = type === "subscription.paid"
      ? await gateway.getTransaction(providerId(data.last_transaction_id ?? data.last_transaction)) : undefined;
    if (payment) requireEvidence(providerId(payment.subscription) === subscription.id);
    return { order, checkout, subscription, payment };
  }
  if (type === "refund.created" || type === "dispute.created") {
    const payment = await gateway.getTransaction(providerId(data.transaction));
    const { rows: [order] } = await getBillingPool().query<BillingOrder>(
      "SELECT o.* FROM billing_orders o JOIN billing_payments p ON p.order_id=o.id WHERE p.transaction_id=$1",[payment.id]);
    // Retry unknown transactions: a reversal may arrive before the payment event.
    if (!order) throw new BillingError("PAYMENT_NOT_READY","Payment reconciliation is pending.",503);
    requireEvidence(order.environment === gateway.environment);
    requireEvidence(type === "dispute.created" || ["refunded","partialRefund"].includes(String(payment.status)));
    return { order, payment, revoke: true };
  }
  return null;
}

async function revokePayment(db: PoolClient, paymentId: string, order: BillingOrder) {
  await db.query("UPDATE billing_payments SET revoked=true WHERE transaction_id=$1",[paymentId]);
  const { rows } = await db.query("SELECT id,remaining FROM credit_grants WHERE payment_id=$1 AND NOT revoked FOR UPDATE",[paymentId]);
  for (const grant of rows) {
    await db.query("UPDATE credit_grants SET revoked=true,remaining=0 WHERE id=$1",[grant.id]);
    await db.query("INSERT INTO credit_ledger(grant_id,reference_id,kind,delta) VALUES ($1,$2,'revoke',$3) ON CONFLICT DO NOTHING",
      [grant.id,paymentId,-grant.remaining]);
  }
  if (order.subscription_id) {
    // A refund of an old period must not revoke a later paid renewal.
    await db.query(`UPDATE billing_subscriptions SET paid_through=COALESCE(
      (SELECT max(period_end) FROM billing_payments WHERE subscription_id=$1 AND NOT revoked), now())
      WHERE id=$1`,[order.subscription_id]);
  } else await db.query("UPDATE billing_orders SET status='revoked' WHERE id=$1",[order.id]);
}

async function fulfill(db: PoolClient, evidence: Evidence, eventTime: number) {
  const { order, checkout, subscription, payment } = evidence;
  const offer = getOrderOffer(order.offer_id);
  requireEvidence(offer);
  if (checkout) {
    const customer = providerId(checkout.customer);
    requireEvidence(!order.customer_id || order.customer_id === customer);
    const subId = checkout.subscription ? providerId(checkout.subscription) : null;
    requireEvidence(!order.subscription_id || order.subscription_id === subId);
    await db.query(`UPDATE billing_orders SET checkout_id=$2,customer_id=$3,subscription_id=$4 WHERE id=$1`,
      [order.id,checkout.id,customer,subId]);
    order.customer_id = customer;
    order.subscription_id = subId;
  }
  if (subscription) {
    requireEvidence(offer.billingType === "recurring");
    await db.query(`INSERT INTO billing_subscriptions(id,user_id,order_id,product_id,customer_id,status,paid_through,last_event_at)
      VALUES ($1,$2,$3,$4,$5,$6,'1970-01-01',$7) ON CONFLICT (id) DO UPDATE SET
      status=CASE WHEN billing_subscriptions.last_event_at <= $7 THEN EXCLUDED.status ELSE billing_subscriptions.status END,
      last_event_at=GREATEST(billing_subscriptions.last_event_at,$7)
      WHERE billing_subscriptions.order_id=EXCLUDED.order_id`,
      [subscription.id,order.user_id,order.id,order.product_id,order.customer_id,String(subscription.status),eventTime]);
  }
  if (!payment) return;
  const paymentId = providerId(payment.id);
  const reversing = evidence.revoke || ["refunded","partialRefund","chargedBack","chargeback"].includes(String(payment.status));
  requireEvidence(payment.currency === order.currency && payment.amount === order.amount_cents
    && (payment.customer == null ? Boolean(order.subscription_id) && payment.subscription === order.subscription_id : providerId(payment.customer) === order.customer_id)
    && (payment.type === (offer.billingType === "recurring" ? "invoice" : "payment")));
  requireEvidence(reversing || (payment.status === "paid" && Number(payment.amount_paid) >= order.amount_cents
    && Number(payment.refunded_amount ?? 0) === 0 && Number(payment.discount_amount ?? 0) === 0));
  const start = offer.billingType === "recurring" ? date(payment.period_start) : null;
  const end = offer.billingType === "recurring" ? date(payment.period_end) : null;
  if (start && end) {
    const expected = monthBoundary(start,offer.billingPeriod === "yearly" ? 12 : 1);
    requireEvidence(end > start && Math.abs(end.getTime()-expected.getTime()) < 86400000);
  }
  const inserted = await db.query(`INSERT INTO billing_payments(transaction_id,order_id,subscription_id,period_start,period_end)
    VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING transaction_id`,
    [paymentId,order.id,order.subscription_id,start,end]);
  const { rows: [stored] } = await db.query("SELECT * FROM billing_payments WHERE transaction_id=$1",[paymentId]);
  requireEvidence(stored && stored.order_id === order.id);
  if (reversing) { await revokePayment(db,paymentId,order); return; }
  if (!inserted.rowCount || stored.revoked) return;
  const months = offer.billingPeriod === "yearly" ? 12 : 1;
  const { rows: [clock] } = await db.query("SELECT now() AS now");
  for (let index = 0; index < months; index++) {
    await grantCredits(db,{ id: `payment:${paymentId}:${index}`,ownerId:`user:${order.user_id}`,
      kind: start ? "subscription" : "purchase",amount:order.credit_amount,paymentId,
      startsAt:start ? monthBoundary(start,index) : new Date(clock.now),
      expiresAt: start && end ? (index === months-1 ? end : monthBoundary(start,index+1)) : null });
  }
  if (end) await db.query("UPDATE billing_subscriptions SET paid_through=GREATEST(paid_through,$2) WHERE id=$1",[order.subscription_id,end]);
  await db.query("UPDATE billing_orders SET status='confirmed',confirmed_at=COALESCE(confirmed_at,now()) WHERE id=$1",[order.id]);
}

export async function processCreemEvent(raw: string, signature: string | null, gateway = getPaymentGateway()) {
  if (!gateway.verifyWebhook(raw,signature)) throw new BillingError("INVALID_SIGNATURE","Invalid webhook signature.",401);
  let event: ProviderObject;
  try { event = object(JSON.parse(raw)); } catch { throw new BillingError("INVALID_EVENT","Invalid webhook payload.",400); }
  const id = providerId(event.id);
  const type = String(event.eventType);
  requireEvidence(Number.isSafeInteger(event.created_at) && Number(event.created_at) > 0);
  const hash = createHash("sha256").update(raw).digest("hex");
  const { rows: [seen] } = await getBillingPool().query("SELECT body_hash FROM billing_events WHERE id=$1",[id]);
  if (seen) { requireEvidence(seen.body_hash === hash); return { received:true,duplicate:true }; }
  const evidence = await collectEvidence(type,object(event.object),gateway);
  return transaction(async db => {
    // Serialize duplicate delivery before writing the ledger.
    await lockOwner(db,`event:${id}`);
    const { rows: [previous] } = await db.query("SELECT body_hash FROM billing_events WHERE id=$1",[id]);
    if (previous) { requireEvidence(previous.body_hash === hash); return { received:true,duplicate:true }; }
    if (evidence) {
      await lockOwner(db,`user:${evidence.order.user_id}`);
      const { rows: [current] } = await db.query<BillingOrder>("SELECT * FROM billing_orders WHERE id=$1 FOR UPDATE",[evidence.order.id]);
      evidence.order = current;
      await fulfill(db,evidence,Number(event.created_at));
    }
    await db.query("INSERT INTO billing_events(id,body_hash,type) VALUES ($1,$2,$3)",[id,hash,type]);
    return { received:true };
  });
}
