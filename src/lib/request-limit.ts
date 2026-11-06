import { createHmac } from "node:crypto";
import { getBillingPool } from "./billing/db";
import { HttpError } from "./http";
import { identitySecret, requestSource } from "./request-source";
export async function rateLimit(request: Request, userId?: string, purpose: "generation" | "usage" = "generation") {
  const guestSource = userId ? undefined : requestSource(request);
  const key = createHmac("sha256", identitySecret()).update(`${purpose}:${userId ? `user:${userId}` : `guest:${guestSource}`}`).digest("hex");
  const { rows: [row] } = await getBillingPool().query(`INSERT INTO request_limits(bucket,window_start,hits)
    VALUES ($1,date_trunc('hour',now()),1)
    ON CONFLICT(bucket) DO UPDATE SET
    hits=CASE WHEN request_limits.window_start=date_trunc('hour',now()) THEN request_limits.hits+1 ELSE 1 END,
    window_start=date_trunc('hour',now()) RETURNING hits`, [key]);
  if (row.hits > (purpose === "usage" ? 300 : userId ? 120 : 30)) throw new HttpError(429, "Too many requests. Please try again later.", "RATE_LIMITED");
  return guestSource;
}
