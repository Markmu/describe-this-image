import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getBillingPool, transaction } from "../db";
import { grantCredits, getUsageStatus, reserveUsage, completeUsage, refundUsage } from "../usage";
import { getAccountPayments, getBillingSummary, getCreditActivity, getCreditSummary, decodeAccountCursor, subscriptionView } from "../../account/queries";
import { accountReturnPath, accountLoginUrl } from "../../account/navigation";

test("account return destinations use an allowlist", () => {
  for (const value of ["https://outside.example", "//outside.example", "/account/plans?next=outside", "/api/auth/signout", undefined]) {
    assert.equal(accountReturnPath(value), "/pricing");
  }
  assert.equal(accountReturnPath("/account/plans"), "/account/plans");
  assert.equal(accountLoginUrl("/account/billing"), "/billing/login?returnTo=%2Faccount%2Fbilling");
});

test("canceled subscriptions retain access until the paid period ends", () => {
  const now = new Date("2026-11-05T00:00:00Z");
  const input = { offer_id: "pro-year", status: "canceled", paid_through: new Date("2027-01-01T00:00:00Z") };
  assert.equal(subscriptionView(input, now).hasAccess, true);
  assert.equal(subscriptionView(input, now).statusLabel, "Renewal canceled");
  assert.equal(subscriptionView({ ...input, paid_through: now }, now).statusLabel, "Expired");
  assert.equal(subscriptionView({ ...input, status: "unpaid" }, now).hasAccess, false);
});

test("malformed history cursors are rejected before querying", () => {
  for (const value of ["not-json", "x".repeat(1601), ...["invalid", "2026-02-30T00:00:00.123456Z", "0000-01-01T00:00:00.000000Z"].map(at => Buffer.from(JSON.stringify({ at, id: "a" })).toString("base64url"))]) {
    assert.throws(() => decodeAccountCursor(value), { code: "INVALID_CURSOR", status: 400 });
  }
});

const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!/^describe_audit(?:_\w+)?$/.test(new URL(database).pathname.slice(1))) throw new Error("Use an isolated describe_audit database for account tests.");
  process.env.DATABASE_URL = database;
  process.env.CREEM_ENVIRONMENT = "test";
}
after(async () => { if (database) await getBillingPool().end(); });

test("account data contracts against PostgreSQL", { skip: !database }, async t => {
  const pool = getBillingPool();
  const userId = () => `account-test:${randomUUID()}`;
  async function order(user: string, offer = "starter", environment = "test") {
    const id = randomUUID();
    const customer = `cus_${randomUUID().replaceAll("-", "")}`;
    await pool.query(`INSERT INTO billing_orders(id,user_id,offer_id,product_id,environment,amount_cents,credit_amount,status,customer_id)
      VALUES($1,$2,$3,'prod_account_test',$4,$5,$6,'confirmed',$7)`, [id, user, offer, environment, offer === "starter" ? 699 : 7990, offer === "starter" ? 300 : 2000, customer]);
    return { id, customer };
  }
  async function payment(orderId: string, suffix = randomUUID()) {
    const id = `txn_${suffix}`;
    await pool.query("INSERT INTO billing_payments(transaction_id,order_id) VALUES($1,$2)", [id, orderId]);
    return id;
  }
  async function grant(user: string, kind: string, amount: number, options: { payment?: string; starts?: Date; expires?: Date } = {}) {
    const id = `account:${randomUUID()}`;
    await transaction(db => grantCredits(db, { id, ownerId: `user:${user}`, kind, amount,
      startsAt: options.starts ?? new Date(Date.now() - 86400000), expiresAt: options.expires, paymentId: options.payment }));
    return id;
  }

  await t.test("new accounts receive one welcome grant and matching activity", async () => {
    const user = userId();
    const activity = await getCreditActivity(user);
    assert.equal(activity.items.length, 1);
    assert.equal(activity.items[0].delta, 20);
    assert.equal((await getCreditSummary(user)).remaining, 20);
    assert.equal((await getCreditSummary(user)).remaining, 20);
    assert.equal((await getBillingSummary(user)).canOpenPortal, false);
    for (let n = 0; n < 2; n++) {
      const usage = await reserveUsage({ userId: user, requestId: randomUUID(), batch: false });
      await completeUsage(usage.reservationId);
    }
    const exhausted = await getCreditSummary(user);
    assert.equal(exhausted.remaining, 0);
    assert.equal(exhausted.descriptions, 0);
  });

  await t.test("balances preserve legacy Starter entitlements and separate future annual windows", async () => {
    const user = userId();
    const starter = await order(user);
    await grant(user, "purchase", 300, { payment: await payment(starter.id) });
    const annual = await order(user, "pro-year");
    const annualPayment = await payment(annual.id);
    await pool.query(`INSERT INTO billing_subscriptions(id,user_id,order_id,product_id,customer_id,status,paid_through)
      VALUES($1,$2,$3,'prod_account_test',$4,'canceled',now()+interval '300 days')`, [`sub_${randomUUID()}`, user, annual.id, annual.customer]);
    const nextMonth = new Date(Date.now() + 29 * 86400000);
    await grant(user, "subscription", 2000, { payment: annualPayment, expires: nextMonth });
    await grant(user, "subscription", 2000, { payment: annualPayment, starts: nextMonth, expires: new Date(Date.now() + 59 * 86400000) });
    await grant(user, "subscription", 700, { expires: new Date(Date.now() - 1000) });
    const revoked = await grant(user, "purchase", 800);
    await pool.query("UPDATE credit_grants SET revoked=true WHERE id=$1", [revoked]);
    const summary = await getCreditSummary(user);
    assert.equal(summary.remaining, 2320);
    assert.equal(summary.descriptions, 232);
    assert.equal(summary.sources.find(source => source.label === "Starter Pack")?.amount, 300);
    assert.equal(summary.nextWindow?.amount, 2000);
    assert.equal(summary.remaining, (await getUsageStatus({ userId: user })).remaining);
    const billing = await getBillingSummary(user);
    assert.equal(billing.subscription?.hasAccess, true);
    assert.equal(billing.subscription?.statusLabel, "Renewal canceled");
    const activity = await getCreditActivity(user);
    assert.equal(activity.items.filter(item => item.label === "Monthly credits").length, 2); // current and historical, excluding future
    assert.equal(activity.items.find(item => item.label === "Monthly credit window ended")?.delta, null);
  });

  await t.test("one generation split across grants appears as one debit and one refund", async () => {
    const user = userId();
    await grant(user, "purchase", 300);
    const reservation = await reserveUsage({ userId: user, requestId: randomUUID(), batch: false });
    await completeUsage(reservation.reservationId);
    const second = await reserveUsage({ userId: user, requestId: randomUUID(), batch: false });
    await completeUsage(second.reservationId);
    // Leave five welcome credits so this generation must span two grants.
    await pool.query("UPDATE credit_grants SET remaining=5 WHERE owner_id=$1 AND kind='welcome'", [`user:${user}`]);
    const split = await reserveUsage({ userId: user, requestId: randomUUID(), batch: false });
    await refundUsage(split.reservationId);
    const history = await getCreditActivity(user);
    const debit = history.items.filter(item => item.id.endsWith(split.reservationId) && item.delta! < 0);
    const returned = history.items.filter(item => item.id.endsWith(split.reservationId) && item.delta! > 0);
    assert.equal(debit.length, 1); assert.equal(debit[0].delta, -10);
    assert.equal(returned.length, 1); assert.equal(returned[0].delta, 10);
  });

  await t.test("credit pagination preserves microseconds, ties and user ownership", async () => {
    const user = userId();
    const other = userId();
    await getCreditSummary(user);
    for (let n = 0; n < 23; n++) await grant(user, "purchase", 10);
    await grant(other, "purchase", 9999);
    await pool.query(`UPDATE credit_ledger SET created_at='2026-01-10T12:00:00.123456Z' WHERE grant_id IN
      (SELECT id FROM credit_grants WHERE owner_id=$1)`, [`user:${user}`]);
    await pool.query("UPDATE credit_grants SET starts_at='2026-01-01T00:00:00Z' WHERE owner_id=$1", [`user:${user}`]);
    const first = await getCreditActivity(user);
    assert.equal(first.items.length, 20); assert.ok(first.nextCursor);
    assert.ok(decodeAccountCursor(first.nextCursor)?.at.endsWith("123456Z"));
    const next = await getCreditActivity(user, first.nextCursor);
    assert.equal(next.items.length, 4); assert.equal(next.nextCursor, null);
    assert.equal(new Set([...first.items, ...next.items].map(item => item.id)).size, 24);
    assert.equal((await getCreditActivity(other, first.nextCursor)).items.length, 0);
  });

  await t.test("payments include renewals, hide foreign environments and never infer charged amounts", async () => {
    const user = userId();
    const own = await order(user);
    const foreignEnvironment = await order(user, "starter", "live");
    const foreignUser = await order(userId());
    const ids: string[] = [];
    for (let n = 0; n < 23; n++) ids.push(await payment(own.id));
    await payment(foreignEnvironment.id); await payment(foreignUser.id);
    await pool.query("UPDATE billing_payments SET revoked=true WHERE transaction_id=$1", [ids[0]]);
    const first = await getAccountPayments(user);
    assert.equal(first.items.length, 20); assert.ok(first.nextCursor);
    const second = await getAccountPayments(user, first.nextCursor);
    const combined = [...first.items, ...second.items];
    assert.equal(combined.length, 23);
    assert.equal(new Set(combined.map(item => item.id)).size, 23);
    assert.ok(combined.every(item => item.amountCents === null));
    assert.equal(combined.find(item => item.id === ids[0])?.status, "reversed");
    const empty = await getBillingSummary(userId());
    assert.equal(empty.subscription, null); assert.deepEqual(empty.pendingOrders, []);
  });
});
