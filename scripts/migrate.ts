import { readdir, readFile } from "node:fs/promises";
import { getBillingPool } from "../src/lib/billing/db";
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL for the intended database before running migrations.");
  const directory = new URL("../src/lib/billing/migrations/",import.meta.url);
  const pool = getBillingPool();
  try {
    for (const name of (await readdir(directory)).filter(name => name.endsWith(".sql")).sort()) {
      await pool.query(await readFile(new URL(name,directory),"utf8"));
      console.log("Applied",name);
    }
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Migration failed. Check database connectivity and schema permissions."); process.exitCode=1; });
