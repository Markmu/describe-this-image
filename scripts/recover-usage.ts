import { getBillingPool } from "../src/lib/billing/db";
import { recoverStaleUsage } from "../src/lib/admin/recovery";
async function main() {
  const pool=getBillingPool();
  try {
    console.log("Recovered stale usage reservations:",(await recoverStaleUsage()).processed);
  } finally {await pool.end();}
}
main().catch(()=>{console.error("Usage recovery failed. Check database connectivity and schema permissions.");process.exitCode=1;});
