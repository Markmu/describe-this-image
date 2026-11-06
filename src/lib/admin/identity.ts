import type { PoolClient } from "pg";
import { getBillingPool } from "../billing/db";
import { BillingError } from "../billing/errors";

export function adminUserIds(env: Record<string, string | undefined> = process.env) {
  return (env.ADMIN_USER_IDS ?? "").split(",").map(id => id.trim()).filter(id => /^google:[a-zA-Z0-9_-]{1,200}$/.test(id));
}

export function isAdminUser(id: string | undefined, env: Record<string, string | undefined> = process.env) {
  return Boolean(id && adminUserIds(env).includes(id));
}

export async function recordLogin(id: string, email?: string | null, name?: string | null) {
  await getBillingPool().query(`INSERT INTO app_users(id,email,name,last_login_at) VALUES($1,$2,$3,now())
    ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,last_login_at=now()`,
  [id, email?.slice(0, 320) ?? null, name?.slice(0, 200) ?? null]);
}

// Both generation reservations and checkout creation call this inside their owner transaction.
export async function assertOperationalAccess(db: PoolClient, userId: string | undefined, action: "generation" | "checkout") {
  const { rows: [settings] } = await db.query("SELECT pause_generation,pause_checkout FROM operation_settings WHERE id=true FOR SHARE");
  if (settings?.[action === "generation" ? "pause_generation" : "pause_checkout"]) {
    throw new BillingError("SERVICE_PAUSED", action === "generation" ? "Image generation is paused. Please try again later." : "New purchases are paused. Existing billing remains available.", 503);
  }
  if (userId) {
    const { rows: [user] } = await db.query("SELECT status FROM app_users WHERE id=$1", [userId]);
    if (user?.status === "banned") throw new BillingError("ACCOUNT_SUSPENDED", "This account cannot generate images or start purchases. Billing history and subscription management remain available.", 403);
  }
}
