import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { lockOwner, transaction } from "./db";
import { BillingError } from "./errors";
import { ACCOUNT_WELCOME_CREDITS, GUEST_FREE_CREDITS } from "../plans";

export type UsageIdentity = { userId?: string; guestId?: string };
export type UsageStatus = {
  remaining: number; freeRemaining: number; paidRemaining: number;
  isPro: boolean; canBatch: boolean; freeAllowance: number; resetsAt: null;
};

function owner(identity: UsageIdentity) {
  const id = identity.userId || identity.guestId;
  if (!id || id.length > 256 || Boolean(identity.userId) === Boolean(identity.guestId)) {
    throw new BillingError("INVALID_IDENTITY", "A verified user or guest identity is required.", 401);
  }
  return `${identity.userId ? "user" : "guest"}:${id}`;
}

export async function grantCredits(db: PoolClient, input: {
  id: string; ownerId: string; kind: string; amount: number;
  startsAt: Date; expiresAt?: Date | null; paymentId?: string;
}) {
  const inserted = await db.query(`INSERT INTO credit_grants
    (id,owner_id,kind,amount,remaining,starts_at,expires_at,payment_id)
    VALUES ($1,$2,$3,$4,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING RETURNING id`,
  [input.id,input.ownerId,input.kind,input.amount,input.startsAt,input.expiresAt ?? null,input.paymentId ?? null]);
  if (inserted.rowCount) await db.query(`INSERT INTO credit_ledger(grant_id,reference_id,kind,delta)
    VALUES ($1,$1,'grant',$2)`, [input.id,input.amount]);
}

async function ensureFreeGrant(db: PoolClient, identity: UsageIdentity, ownerId: string) {
  const { rows: [clock] } = await db.query("SELECT now() AS now");
  const now = new Date(clock.now);
  await grantCredits(db, {
    id: identity.userId ? `welcome:${ownerId}` : `guest:${ownerId}`,
    ownerId, kind: identity.userId ? "welcome" : "guest",
    amount: identity.userId ? ACCOUNT_WELCOME_CREDITS : GUEST_FREE_CREDITS,
    startsAt: now,
  });
}

async function statusInTransaction(db: PoolClient, identity: UsageIdentity, ownerId: string): Promise<UsageStatus> {
  await ensureFreeGrant(db,identity,ownerId);
  const { rows: [balance] } = await db.query(`SELECT
    COALESCE(sum(remaining) FILTER (WHERE kind IN ('welcome','guest')),0)::int AS free,
    COALESCE(sum(remaining) FILTER (WHERE kind IN ('purchase','subscription')),0)::int AS paid
    FROM credit_grants WHERE owner_id=$1 AND NOT revoked AND starts_at <= now()
    AND kind IN ('welcome','guest','purchase','subscription')
    AND (expires_at IS NULL OR expires_at > now())`, [ownerId]);
  const { rows: [pro] } = await db.query(`SELECT EXISTS(SELECT 1 FROM billing_subscriptions
    WHERE user_id=$1 AND paid_through > now() AND status IN ('active','canceled','scheduled_cancel')) AS active`, [identity.userId ?? ""]);
  return { remaining: balance.free + balance.paid, freeRemaining: balance.free, paidRemaining: balance.paid,
    isPro: pro.active, canBatch: pro.active,
    freeAllowance: identity.userId ? ACCOUNT_WELCOME_CREDITS : GUEST_FREE_CREDITS, resetsAt: null };
}

export async function getUsageStatus(identity: UsageIdentity): Promise<UsageStatus> {
  const ownerId = owner(identity);
  return transaction(async db => {
    await lockOwner(db,ownerId);
    return statusInTransaction(db,identity,ownerId);
  });
}

export async function reserveUsage(input: UsageIdentity & { requestId: string; batch: boolean; units?: number }) {
  const ownerId = owner(input);
  const units = input.units ?? 1;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(input.requestId) || !Number.isSafeInteger(units) || units < 1 || units > 20 || (!input.batch && units !== 1)) {
    throw new BillingError("INVALID_USAGE", "Invalid usage request.", 400);
  }
  return transaction(async db => {
    await lockOwner(db,ownerId);
    const existing = await db.query("SELECT id FROM usage_reservations WHERE owner_id=$1 AND request_id=$2", [ownerId,input.requestId]);
    // The caller must never run the model twice against the same reservation.
    if (existing.rowCount) throw new BillingError("REQUEST_ALREADY_USED", "This request has already been submitted. Use a new request ID.", 409);
    const status = await statusInTransaction(db,input,ownerId);
    if (input.batch && !status.canBatch) throw new BillingError("PRO_REQUIRED", "An active Pro subscription is required for batches.", 403);
    if (status.remaining < units) throw new BillingError("QUOTA_EXCEEDED", "You have insufficient credits for this request.", 429);
    const reservationId = randomUUID();
    await db.query(`INSERT INTO usage_reservations (id,owner_id,request_id,units,batch,status)
      VALUES ($1,$2,$3,$4,$5,'reserved')`, [reservationId,ownerId,input.requestId,units,input.batch]);
    const { rows } = await db.query(`SELECT id,remaining FROM credit_grants
      WHERE owner_id=$1 AND NOT revoked AND starts_at <= now() AND remaining > 0
      AND kind IN ('welcome','guest','purchase','subscription')
      AND (expires_at IS NULL OR expires_at > now())
      ORDER BY CASE WHEN kind IN ('welcome','guest') THEN 0 ELSE 1 END,
      expires_at ASC NULLS LAST, starts_at, id FOR UPDATE`, [ownerId]);
    let needed = units;
    for (const grant of rows) {
      const take = Math.min(needed,grant.remaining);
      await db.query("UPDATE credit_grants SET remaining=remaining-$2 WHERE id=$1", [grant.id,take]);
      await db.query("INSERT INTO usage_allocations VALUES ($1,$2,$3)", [reservationId,grant.id,take]);
      await db.query("INSERT INTO credit_ledger(grant_id,reference_id,kind,delta) VALUES ($1,$2,'reserve',$3)", [grant.id,reservationId,-take]);
      needed -= take;
      if (!needed) break;
    }
    return { reservationId, remaining: status.remaining - units };
  });
}

async function settleUsage(reservationId: string, refund: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(reservationId)) throw new BillingError("INVALID_USAGE", "Invalid reservation.",400);
  await transaction(async db => {
    const { rows: [lookup] } = await db.query("SELECT owner_id FROM usage_reservations WHERE id=$1", [reservationId]);
    if (!lookup) throw new BillingError("RESERVATION_NOT_FOUND", "Usage reservation was not found.",404);
    await lockOwner(db,lookup.owner_id);
    const { rows: [reservation] } = await db.query("SELECT status FROM usage_reservations WHERE id=$1 FOR UPDATE", [reservationId]);
    const target = refund ? "refunded" : "completed";
    if (reservation.status === target) return;
    if (reservation.status !== "reserved") throw new BillingError("USAGE_ALREADY_SETTLED", "Usage reservation was settled.",409);
    if (refund) {
      const { rows } = await db.query("SELECT grant_id,amount FROM usage_allocations WHERE reservation_id=$1 ORDER BY grant_id", [reservationId]);
      for (const row of rows) {
        const restored = await db.query("UPDATE credit_grants SET remaining=remaining+$2 WHERE id=$1 AND NOT revoked RETURNING id", [row.grant_id,row.amount]);
        if (restored.rowCount) await db.query("INSERT INTO credit_ledger(grant_id,reference_id,kind,delta) VALUES ($1,$2,'refund',$3)", [row.grant_id,reservationId,row.amount]);
      }
    }
    await db.query("UPDATE usage_reservations SET status=$2 WHERE id=$1", [reservationId,target]);
  });
}

export const completeUsage = (reservationId: string) => settleUsage(reservationId,false);
export const refundUsage = (reservationId: string) => settleUsage(reservationId,true);
