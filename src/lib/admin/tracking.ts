import { randomUUID } from "node:crypto";
import { getBillingPool } from "../billing/db";
import { BillingError } from "../billing/errors";
import { HttpError } from "../http";

export type GenerationStage = "reservation" | "moderation" | "moderation_passed" | "generation" | "settlement" | "refunded" | "refund_pending";

export function requestOutcome(error: unknown, stage: string) {
  const known = error instanceof BillingError || error instanceof HttpError;
  const code = known && error.code ? error.code : stage === "moderation" ? "MODERATION_UNAVAILABLE"
    : stage === "generation" ? "MODEL_UNAVAILABLE" : stage === "settlement" ? "SETTLEMENT_FAILED" : "REQUEST_FAILED";
  const result = code === "CONTENT_BLOCKED" ? "blocked" : code === "QUOTA_EXCEEDED" ? "quota_exceeded"
    : code === "RATE_LIMITED" ? "rate_limited" : code === "ACCOUNT_SUSPENDED" ? "suspended"
    : code === "SERVICE_PAUSED" ? "paused" : stage === "moderation" ? "moderation_failed"
    : stage === "generation" ? "model_failed" : known && error.status === 429 ? "rate_limited"
    : known && error.status < 500 ? "invalid" : "service_failed";
  return { code, result };
}

// Metadata writes cannot change payment/usage outcomes. No image, prompt or provider body is accepted here.
export function generationTrace() {
  const id = randomUUID();
  let stage = "received";
  const safe = async (sql: string, values: unknown[]) => {
    try { await getBillingPool().query(sql, values); }
    catch { console.error("GENERATION_TRACE_UNAVAILABLE", id); }
  };
  const event = async (name: string, reservationId?: string) => {
    if (!["refunded", "refund_pending", "moderation_passed"].includes(name)) stage = name;
    await safe(`UPDATE generation_requests SET stage=$2,
      reservation_id=COALESCE($3::uuid,reservation_id),
      moderation=CASE WHEN $4='moderation_passed' THEN 'passed' ELSE moderation END,
      stages=stages || jsonb_build_array(jsonb_build_object('stage',$4::text,'at',clock_timestamp())) WHERE id=$1`,
    [id, stage, reservationId ?? null, name]);
  };
  return {
    id,
    async start() {
      await safe(`INSERT INTO generation_requests(id,stages,model)
        VALUES($1,jsonb_build_array(jsonb_build_object('stage','received','at',clock_timestamp())),$2)`, [id, process.env.VISION_MODEL?.slice(0, 100) ?? null]);
    },
    async identify(userId?: string, guestId?: string) {
      await safe("UPDATE generation_requests SET owner_id=$2 WHERE id=$1", [id, userId ? `user:${userId}` : guestId ? `guest:${guestId}` : null]);
    },
    async input(requestId: string, language: string, batch: boolean) {
      await safe("UPDATE generation_requests SET client_request_id=$2,language=$3,batch=$4 WHERE id=$1", [id, requestId.slice(0,128), language.slice(0,100), batch]);
    },
    event,
    async finish(error?: unknown) {
      const outcome = error ? requestOutcome(error, stage) : { result: "succeeded", code: null };
      await safe(`UPDATE generation_requests SET result=$2,error_code=$3,completed_at=clock_timestamp(),
        duration_ms=LEAST(2147483647,greatest(0,extract(epoch FROM(clock_timestamp()-created_at))*1000))::int,
        moderation=CASE WHEN $2='blocked' THEN 'blocked' ELSE moderation END WHERE id=$1`, [id, outcome.result, outcome.code]);
    },
  };
}
