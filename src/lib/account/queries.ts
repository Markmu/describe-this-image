import { getBillingPool, transaction, lockOwner } from "../billing/db";
import { getUsageStatus } from "../billing/usage";
import { BillingError } from "../billing/errors";
import { getOrderOffer } from "../billing/types";
import { CREDITS_PER_IMAGE } from "../plans";
import type { AccountPage, AccountPayment, AccountSubscription, BillingSummary, CreditActivity, CreditSource, CreditSummary, DescriptionHistoryEntry } from "./types";

const PAGE_SIZE = 20;
type Cursor = { at: string; id: string };

function accountOwner(userId: string) {
  if (!userId || userId.length > 256) throw new BillingError("LOGIN_REQUIRED", "Sign in to view your account.", 401);
  return `user:${userId}`;
}

export function decodeAccountCursor(value?: string | null): Cursor | null {
  if (!value) return null;
  try {
    if (value.length > 1600 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof cursor.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(cursor.at)
      || !Number.isFinite(Date.parse(cursor.at)) || typeof cursor.id !== "string" || !cursor.id || cursor.id.length > 512) throw new Error();
    if (cursor.at.startsWith("0000") || new Date(cursor.at).toISOString() !== `${cursor.at.slice(0, 23)}Z`) throw new Error();
    return { at: cursor.at, id: cursor.id };
  } catch {
    throw new BillingError("INVALID_CURSOR", "This history link is invalid. Refresh the page to start again.", 400);
  }
}

function pageOf<T extends { id: string; createdAt: string }>(rows: T[]): AccountPage<T> {
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last
    ? Buffer.from(JSON.stringify({ at: last.createdAt, id: last.id })).toString("base64url") : null };
}

export async function getDescriptionHistory(userId: string, value?: string | null): Promise<AccountPage<DescriptionHistoryEntry>> {
  const ownerId = accountOwner(userId);
  const cursor = decodeAccountCursor(value);
  const { rows } = await getBillingPool().query<DescriptionHistoryEntry>(`WITH access AS (
    SELECT EXISTS(SELECT 1 FROM billing_subscriptions WHERE user_id=substring($1::text FROM 6)
      AND paid_through>now() AND status IN ('active','canceled','scheduled_cancel')) AS active
    ) SELECT id::text,
    to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
    language,batch,outputs,access.active AS "subscriptionActive",
    CASE WHEN access.active THEN NULL ELSE to_char((created_at+interval '30 days') AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END AS "expiresAt"
    FROM description_history CROSS JOIN access WHERE owner_id=$1 AND (access.active OR created_at>now()-interval '30 days')
    AND ($2::timestamptz IS NULL OR (created_at,id::text)<($2::timestamptz,$3::text))
    ORDER BY created_at DESC,id DESC LIMIT $4`, [ownerId,cursor?.at ?? null,cursor?.id ?? null,PAGE_SIZE+1]);
  return pageOf(rows);
}

export function subscriptionView(row: { offer_id: string; status: string; paid_through: Date }, now = new Date()): AccountSubscription {
  const hasAccess = row.paid_through > now && ["active", "scheduled_cancel", "canceled"].includes(row.status);
  const statusLabel = row.paid_through <= now ? "Expired"
    : row.status === "scheduled_cancel" || row.status === "canceled" ? "Renewal canceled"
    : row.status === "active" ? "Active" : "Payment status unavailable";
  return {
    name: getOrderOffer(row.offer_id)?.name ?? "Pro subscription",
    interval: row.offer_id === "pro-year" ? "yearly" : "monthly",
    status: row.status, statusLabel, hasAccess, paidThrough: row.paid_through.toISOString(),
  };
}

function billingEnvironment() {
  const environment = process.env.CREEM_ENVIRONMENT;
  if (environment !== "test" && environment !== "live") {
    throw new BillingError("BILLING_NOT_CONFIGURED", "Billing information is unavailable. Please contact the site owner.");
  }
  return environment;
}

export async function getCreditSummary(userId: string): Promise<CreditSummary> {
  const ownerId = accountOwner(userId);
  // Reuse the usage service's idempotent welcome grant before reading the account snapshot.
  await getUsageStatus({ userId });
  return transaction(async db => {
    await lockOwner(db, ownerId);
    const { rows } = await db.query<{
      id: string; kind: string; amount: number; remaining: number; starts_at: Date; expires_at: Date | null;
      future: boolean; offer_id: string | null;
    }>(`SELECT g.*, g.starts_at > now() AS future, o.offer_id
      FROM credit_grants g LEFT JOIN billing_payments p ON p.transaction_id=g.payment_id
      LEFT JOIN billing_orders o ON o.id=p.order_id AND o.user_id=$2
      WHERE g.owner_id=$1 AND NOT g.revoked AND g.kind IN ('welcome','purchase','subscription','compensation')
      AND (g.expires_at IS NULL OR g.expires_at > now()) ORDER BY g.starts_at,g.id`, [ownerId, userId]);
    const sources = new Map<string, CreditSource>();
    let nextWindow: CreditSummary["nextWindow"] = null;
    for (const row of rows) {
      if (row.future) {
        if (row.kind === "subscription" && !nextWindow) nextWindow = { startsAt: row.starts_at.toISOString(), amount: row.amount };
        else if (row.kind === "subscription" && nextWindow?.startsAt === row.starts_at.toISOString()) nextWindow.amount += row.amount;
        continue;
      }
      const expiresAt = row.expires_at?.toISOString() ?? null;
      const label = row.kind === "welcome" ? "Welcome credits"
        : row.kind === "subscription" ? "Subscription credits" : row.kind === "compensation" ? "Support credits"
        : row.offer_id === "starter" ? "Starter Pack"
        : row.offer_id === "addon-1000" ? "Add-on credits" : "Purchased credits";
      const key = `${label}:${expiresAt ?? "no-expiry"}`;
      const source = sources.get(key) ?? { id: key, label, kind: row.kind, amount: 0, remaining: 0, expiresAt };
      source.amount += row.amount;
      source.remaining += row.remaining;
      sources.set(key, source);
    }
    const remaining = Array.from(sources.values()).reduce((sum, source) => sum + source.remaining, 0);
    return { remaining, descriptions: Math.floor(remaining / CREDITS_PER_IMAGE), sources: Array.from(sources.values()), nextWindow };
  });
}

export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  accountOwner(userId);
  const environment = billingEnvironment();
  const pool = getBillingPool();
  const [subscriptions, portal, pending] = await Promise.all([
    pool.query<{ offer_id: string; status: string; paid_through: Date }>(`SELECT o.offer_id,s.status,s.paid_through
      FROM billing_subscriptions s JOIN billing_orders o ON o.id=s.order_id AND o.user_id=s.user_id
      WHERE s.user_id=$1 AND o.environment=$2
      ORDER BY (s.paid_through > now() AND s.status IN ('active','scheduled_cancel','canceled')) DESC,
      s.paid_through DESC,s.id DESC LIMIT 1`, [userId, environment]),
    pool.query(`SELECT 1 FROM billing_orders WHERE user_id=$1 AND environment=$2 AND customer_id IS NOT NULL LIMIT 1`, [userId, environment]),
    pool.query<{ id: string; offer_id: string; created_at: Date; amount_cents: number; currency: string }>(`SELECT id,offer_id,created_at,amount_cents,currency
      FROM billing_orders WHERE user_id=$1 AND environment=$2 AND status='pending'
      AND created_at > now()-interval '24 hours' ORDER BY created_at DESC,id DESC LIMIT 5`, [userId, environment]),
  ]);
  return {
    subscription: subscriptions.rows[0] ? subscriptionView(subscriptions.rows[0]) : null,
    canOpenPortal: Boolean(portal.rowCount),
    pendingOrders: pending.rows.map(row => ({ id: row.id, name: getOrderOffer(row.offer_id)?.name ?? "Purchase",
      createdAt: row.created_at.toISOString(), amountCents: row.amount_cents, currency: row.currency })),
  };
}

export async function getCreditActivity(userId: string, value?: string | null): Promise<AccountPage<CreditActivity>> {
  const ownerId = accountOwner(userId);
  const cursor = decodeAccountCursor(value);
  await getUsageStatus({ userId });
  const { rows } = await getBillingPool().query<{
    id: string; createdAt: string; kind: string; grant_kind: string; delta: number | null; units: number | null; reservation_status: string | null;
  }>(`WITH activity AS (
      SELECT 'ledger:' || l.kind || ':' || l.reference_id AS id,
        max(CASE WHEN l.kind='grant' THEN greatest(g.starts_at,l.created_at) ELSE l.created_at END) AS occurred_at,
        l.kind, min(g.kind) AS grant_kind,
        sum(CASE WHEN l.kind='reserve' AND r.credits_per_image=1 AND g.kind IN ('guest','welcome') THEN l.delta*10 ELSE l.delta END)::int AS delta,
        max(r.units)::int AS units,max(r.status) AS reservation_status
      FROM credit_ledger l JOIN credit_grants g ON g.id=l.grant_id
      LEFT JOIN usage_reservations r ON r.id::text=l.reference_id AND r.owner_id=$1
      WHERE g.owner_id=$1 AND g.kind IN ('welcome','purchase','subscription','compensation')
      AND (l.kind<>'grant' OR g.starts_at<=now()) GROUP BY l.kind,l.reference_id
      UNION ALL
      SELECT 'expiry:' || g.id,g.expires_at,'expiry',g.kind,NULL::int,NULL::int,NULL::text
      FROM credit_grants g WHERE g.owner_id=$1 AND g.kind='subscription' AND g.expires_at<=now()
    ) SELECT id,to_char(occurred_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
      kind,grant_kind,delta,units,reservation_status FROM activity
    WHERE ($2::timestamptz IS NULL OR (occurred_at,id)<($2::timestamptz,$3::text))
    ORDER BY occurred_at DESC,id DESC LIMIT $4`, [ownerId, cursor?.at ?? null, cursor?.id ?? null, PAGE_SIZE + 1]);
  return pageOf(rows.map(row => {
    const label = row.kind === "reserve" ? "Image description" : row.kind === "refund" ? "Credits returned"
      : row.kind === "revoke" ? "Payment reversed" : row.kind === "expiry" ? "Monthly credit window ended"
      : row.id.includes("free-denomination-10:") ? "Credit adjustment"
      : row.grant_kind === "welcome" ? "Welcome credits" : row.grant_kind === "subscription" ? "Monthly credits" : row.grant_kind === "compensation" ? "Support credits" : "Credit purchase";
    const detail = row.kind === "expiry" ? "Window expiry inferred from grant dates"
      : row.kind === "reserve" ? `${row.units ?? 1} image${row.units === 1 ? "" : "s"} · ${row.reservation_status === "reserved" ? "Processing" : row.reservation_status === "refunded" ? "Returned in a separate entry" : "Completed"}`
      : row.kind === "grant" && row.grant_kind === "purchase" ? "No expiry" : "";
    return { id: row.id, createdAt: row.createdAt, label, detail, delta: row.delta };
  }));
}

export async function getAccountPayments(userId: string, value?: string | null): Promise<AccountPage<AccountPayment>> {
  accountOwner(userId);
  const environment = billingEnvironment();
  const cursor = decodeAccountCursor(value);
  const { rows } = await getBillingPool().query<{
    id: string; createdAt: string; offer_id: string; revoked: boolean; period_start: Date | null; period_end: Date | null; amount_paid: number | null;
  }>(`SELECT p.transaction_id AS id,to_char(p.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt",
      o.offer_id,p.revoked,p.period_start,p.period_end,p.amount_paid
      FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id
      WHERE o.user_id=$1 AND o.environment=$2
      AND ($3::timestamptz IS NULL OR (p.created_at,p.transaction_id)<($3::timestamptz,$4::text))
      ORDER BY p.created_at DESC,p.transaction_id DESC LIMIT $5`, [userId, environment, cursor?.at ?? null, cursor?.id ?? null, PAGE_SIZE + 1]);
  return pageOf(rows.map(row => ({ id: row.id, createdAt: row.createdAt, name: getOrderOffer(row.offer_id)?.name ?? "Purchase",
    status: row.revoked ? "reversed" : "confirmed", periodStart: row.period_start?.toISOString() ?? null,
    periodEnd: row.period_end?.toISOString() ?? null, amountCents: row.amount_paid })));
}
