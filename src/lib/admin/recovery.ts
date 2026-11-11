import { randomUUID } from "node:crypto";
import { getBillingPool, lockOwner, transaction } from "../billing/db";
import { recoverReservation } from "./actions";
import { HttpError } from "../http";

export async function recoverStaleUsage() {
  const id = randomUUID();
  const pool = getBillingPool();
  await pool.query("INSERT INTO operation_tasks(id,name,status) VALUES($1,'usage-recovery','running')", [id]);
  let processed = 0;
  try {
    const { rows } = await pool.query("SELECT id FROM usage_reservations WHERE status='reserved' AND created_at < now()-interval '5 minutes' ORDER BY created_at LIMIT 500");
    for (const row of rows) {
      try { await transaction(db => recoverReservation(db, row.id)); processed++; }
      catch (error) { if (!(error instanceof HttpError && error.code === "RECOVERY_NOT_ELIGIBLE")) throw error; }
    }
    await pool.query("UPDATE operation_tasks SET status='succeeded',processed=$2,finished_at=now() WHERE id=$1", [id, processed]);
    return { id, processed };
  } catch (error) {
    await pool.query("UPDATE operation_tasks SET status='failed',processed=$2,error_code='RECOVERY_FAILED',finished_at=now() WHERE id=$1", [id, processed]);
    throw error;
  }
}

// Invoked by the deployment scheduler. Keep financial and audit records outside telemetry pruning.
export async function pruneOperationalMetadata() {
  return transaction(async db => {
    await lockOwner(db, "telemetry-prune");
    const descriptions = await db.query(`DELETE FROM description_history h WHERE h.created_at <= now()-interval '30 days'
      AND NOT EXISTS(SELECT 1 FROM billing_subscriptions s WHERE h.owner_id LIKE 'user:%'
        AND s.user_id=substring(h.owner_id FROM 6) AND s.paid_through>now()
        AND s.status IN ('active','canceled','scheduled_cancel'))`);
    const requests = await db.query(`DELETE FROM generation_requests r WHERE r.created_at <= now()-interval '30 days' AND r.result <> 'processing'
      AND NOT EXISTS(SELECT 1 FROM billing_subscriptions s WHERE r.owner_id LIKE 'user:%'
        AND s.user_id=substring(r.owner_id FROM 6) AND s.paid_through>now()
        AND s.status IN ('active','canceled','scheduled_cancel'))
      AND (r.result IN ('succeeded','blocked','invalid','quota_exceeded','rate_limited','suspended','paused') OR EXISTS(
        SELECT 1 FROM operation_cases c WHERE c.source_type='request' AND c.source_id=r.id::text AND c.status='resolved'))`);
    const attempts = await db.query(`DELETE FROM webhook_attempts w WHERE w.created_at < now()-interval '90 days' AND (w.result <> 'failed' OR EXISTS(
      SELECT 1 FROM operation_cases c WHERE c.source_type='webhook' AND c.source_id=w.id::text AND c.status='resolved') OR EXISTS(
      SELECT 1 FROM webhook_attempts a WHERE a.event_id=w.event_id AND a.result IN ('succeeded','duplicate') AND a.created_at>w.created_at))`);
    const tasks = await db.query(`DELETE FROM operation_tasks t WHERE t.started_at < now()-interval '90 days' AND (t.status='succeeded' OR EXISTS(
      SELECT 1 FROM operation_cases c WHERE c.source_type='task' AND c.source_id=t.id::text AND c.status='resolved'))`);
    return { descriptions: descriptions.rowCount, requests: requests.rowCount, attempts: attempts.rowCount, tasks: tasks.rowCount };
  });
}
