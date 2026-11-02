import { Pool, type PoolClient } from "pg";
import { BillingError } from "./errors";

let pool: Pool | undefined;

export function getBillingPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new BillingError("DATABASE_UNAVAILABLE", "Usage and billing storage is not configured.");
  }
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5,
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
    statement_timeout: 10000 });
  return pool;
}

export async function transaction<T>(run: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await getBillingPool().connect();
  try {
    await db.query("BEGIN");
    const result = await run(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}

export async function lockOwner(db: PoolClient, ownerId: string) {
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [ownerId]);
}
