import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { getBillingPool, lockOwner, transaction } from "../billing/db";
import { BillingError } from "../billing/errors";
import { grantCredits, settleUsageInTransaction } from "../billing/usage";
import { HttpError } from "../http";
import { isAdminUser } from "./identity";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const actions = ["ban", "unban", "compensate", "recover", "settings", "case", "probe"] as const;
type ActionName = typeof actions[number];
export type AdminAction = {
  operationId: string; action: ActionName; target: string; reason: string;
  amount?: number; expiresAt?: string; reference?: string;
  pauseGeneration?: boolean; pauseCheckout?: boolean;
  sourceType?: string; status?: string;
};

export function parseAdminAction(value: Record<string, unknown>): AdminAction {
  if (typeof value.operationId !== "string" || !uuid.test(value.operationId)
    || !actions.includes(value.action as ActionName) || typeof value.target !== "string"
    || value.target.length < 1 || value.target.length > 256
    || typeof value.reason !== "string" || value.reason.trim().length < 3 || value.reason.length > 1000) {
    throw new HttpError(400, "Choose an action, target and reason (3–1,000 characters).", "INVALID_ADMIN_ACTION");
  }
  const input: AdminAction = { operationId: value.operationId, action: value.action as ActionName, target: value.target, reason: value.reason.trim() };
  if (input.action === "compensate") {
    if (!Number.isSafeInteger(value.amount) || Number(value.amount) < 1 || Number(value.amount) > 100000) throw new HttpError(400, "Enter 1–100,000 whole credits.");
    input.amount = Number(value.amount);
    if (value.expiresAt) {
      if (typeof value.expiresAt !== "string" || !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()) throw new HttpError(400, "Expiry must be in the future.");
      input.expiresAt = new Date(value.expiresAt).toISOString();
    }
    if (value.reference != null && (typeof value.reference !== "string" || value.reference.length > 256)) throw new HttpError(400, "Invalid related order or request.");
    input.reference = typeof value.reference === "string" ? value.reference : undefined;
  }
  if (input.action === "recover" && !uuid.test(input.target)) throw new HttpError(400, "Choose a reservation.");
  if (input.action === "settings") {
    if (input.target !== "settings" || typeof value.pauseGeneration !== "boolean" || typeof value.pauseCheckout !== "boolean") throw new HttpError(400, "Choose both service states.");
    input.pauseGeneration = value.pauseGeneration; input.pauseCheckout = value.pauseCheckout;
  }
  if (input.action === "case") {
    if (!["order", "webhook", "request", "reservation", "task"].includes(String(value.sourceType)) || !["open", "processing", "resolved"].includes(String(value.status))) throw new HttpError(400, "Choose a case type and status.");
    input.sourceType = String(value.sourceType); input.status = String(value.status);
  }
  if (input.action === "probe" && input.target !== "database") throw new HttpError(400, "This probe is not supported.");
  return input;
}

export async function recoverReservation(db: PoolClient, id: string) {
  const { rows: [owner] } = await db.query("SELECT owner_id FROM usage_reservations WHERE id=$1", [id]);
  if (!owner) throw new HttpError(404, "Reservation was not found.");
  await lockOwner(db, owner.owner_id);
  const { rows: [row] } = await db.query("SELECT status,created_at < now()-interval '5 minutes' AS stale FROM usage_reservations WHERE id=$1 FOR UPDATE", [id]);
  if (row.status !== "reserved" || !row.stale) throw new HttpError(409, "Only unsettled reservations older than five minutes can be recovered.", "RECOVERY_NOT_ELIGIBLE");
  await settleUsageInTransaction(db, id, true);
  await db.query(`UPDATE generation_requests SET result='service_failed',stage='recovery',error_code='RESERVATION_RECOVERED',completed_at=now(),
    stages=stages||jsonb_build_array(jsonb_build_object('stage','refunded','at',clock_timestamp()))
    WHERE reservation_id=$1 AND result='processing'`, [id]);
  return { reservationId: id, status: "refunded" };
}

async function applyAction(db: PoolClient, actorId: string, input: AdminAction): Promise<Record<string, unknown>> {
  if (["ban", "unban", "compensate"].includes(input.action)) {
    await lockOwner(db, `user:${input.target}`);
    const { rows: [user] } = await db.query("SELECT status FROM app_users WHERE id=$1 FOR UPDATE", [input.target]);
    if (!user) throw new HttpError(404, "User was not found.");
    if (input.action === "compensate") {
      const id = `compensation:${input.operationId}`;
      const { rows: [clock] } = await db.query("SELECT now() AS now");
      await grantCredits(db, { id, ownerId: `user:${input.target}`, kind: "compensation", amount: input.amount!, startsAt: new Date(clock.now), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null });
      return { grantId: id, credits: input.amount, expiresAt: input.expiresAt ?? null, reference: input.reference ?? null };
    }
    if (isAdminUser(input.target)) throw new HttpError(409, "Administrator accounts cannot be suspended here.");
    const status = input.action === "ban" ? "banned" : "active";
    await db.query("UPDATE app_users SET status=$2,ban_reason=$3 WHERE id=$1", [input.target, status, status === "banned" ? input.reason : null]);
    return { before: user.status, after: status };
  }
  if (input.action === "recover") return recoverReservation(db, input.target);
  if (input.action === "settings") {
    const { rows: [before] } = await db.query("SELECT pause_generation,pause_checkout FROM operation_settings WHERE id=true FOR UPDATE");
    await db.query("UPDATE operation_settings SET pause_generation=$1,pause_checkout=$2,updated_at=now() WHERE id=true", [input.pauseGeneration, input.pauseCheckout]);
    return { before, after: { pause_generation: input.pauseGeneration, pause_checkout: input.pauseCheckout } };
  }
  if (input.action === "case") {
    const source = { order: ["billing_orders", "id"], webhook: ["webhook_attempts", "id"], request: ["generation_requests", "id"], reservation: ["usage_reservations", "id"], task: ["operation_tasks", "id"] }[input.sourceType!];
    if (!source || !(await db.query(`SELECT 1 FROM ${source[0]} WHERE ${source[1]}::text=$1`, [input.target])).rowCount) throw new HttpError(404, "Case source was not found.");
    await db.query(`INSERT INTO operation_cases(source_type,source_id,status,note,actor_id) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(source_type,source_id) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note,actor_id=EXCLUDED.actor_id,updated_at=now()`,
    [input.sourceType, input.target, input.status, input.reason, actorId]);
    return { status: input.status };
  }
  await db.query("SELECT 1");
  await db.query("INSERT INTO operation_probes(service,status) VALUES('database','passed') ON CONFLICT(service) DO UPDATE SET status='passed',checked_at=now()");
  return { service: "database", status: "passed" };
}

export async function executeAdminAction(actorId: string, raw: Record<string, unknown>) {
  if (!isAdminUser(actorId)) throw new HttpError(403, "Administrator access is required.");
  const input = parseAdminAction(raw);
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  try {
    return await transaction(async db => {
      await lockOwner(db, `admin-operation:${input.operationId}`);
      const { rows: [previous] } = await db.query("SELECT * FROM admin_audit WHERE id=$1", [input.operationId]);
      if (previous) {
        if (previous.actor_id !== actorId || previous.request_hash !== hash) throw new HttpError(409, "This operation ID belongs to another action.", "OPERATION_CONFLICT");
        if (previous.result === "failed") throw new HttpError(409, "This operation failed. Review the issue and submit a new operation.", "OPERATION_FAILED");
        return { ok: true, duplicate: true, summary: previous.summary };
      }
      const summary = await applyAction(db, actorId, input);
      await db.query(`INSERT INTO admin_audit(id,actor_id,action,target,reason,request_hash,summary,result) VALUES($1,$2,$3,$4,$5,$6,$7,'succeeded')`,
      [input.operationId, actorId, input.action, input.target, input.reason, hash, JSON.stringify(summary)]);
      return { ok: true, duplicate: false, summary };
    });
  } catch (error) {
    const code = error instanceof HttpError || error instanceof BillingError ? error.code ?? `HTTP_${error.status}` : "ADMIN_ACTION_FAILED";
    try {
      await getBillingPool().query(`INSERT INTO admin_audit(id,actor_id,action,target,reason,request_hash,result,error_code) VALUES($1,$2,$3,$4,$5,$6,'failed',$7) ON CONFLICT DO NOTHING`,
      [input.operationId, actorId, input.action, input.target, input.reason, hash, code]);
    } catch { console.error("ADMIN_AUDIT_UNAVAILABLE", input.operationId); }
    throw error;
  }
}
