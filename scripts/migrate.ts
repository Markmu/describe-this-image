import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getBillingPool } from "../src/lib/billing/db";
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL for the intended database before running migrations.");
  const directory = new URL("../src/lib/billing/migrations/",import.meta.url);
  const pool = getBillingPool();
  const db = await pool.connect();
  try {
    await db.query("SELECT pg_advisory_lock(hashtextextended('schema-migrations',0))");
    await db.query("CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,hash text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())");
    for (const name of (await readdir(directory)).filter(name => name.endsWith(".sql")).sort()) {
      const sql = await readFile(new URL(name,directory),"utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const {rows:[previous]} = await db.query("SELECT hash FROM schema_migrations WHERE name=$1",[name]);
      if (previous) {
        if(previous.hash!==hash) throw new Error("An applied migration has changed.");
        continue;
      }
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations(name,hash) VALUES($1,$2)",[name,hash]);
      console.log("Applied",name);
    }
  } finally { await db.query("SELECT pg_advisory_unlock(hashtextextended('schema-migrations',0))").catch(()=>{}); db.release(); await pool.end(); }
}
main().catch(() => { console.error("Migration failed. Check database connectivity and schema permissions."); process.exitCode=1; });
