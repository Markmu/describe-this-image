import { getBillingPool } from "../src/lib/billing/db";
import { refundUsage } from "../src/lib/billing/usage";
import { BillingError } from "../src/lib/billing/errors";
async function main() {
  const pool=getBillingPool();
  try {
    const {rows}=await pool.query("SELECT id FROM usage_reservations WHERE status='reserved' AND created_at < now()-interval '5 minutes' ORDER BY created_at LIMIT 500");
    let recovered=0;
    for(const row of rows) {
      try {await refundUsage(row.id);recovered++;}
      catch(error) {if(!(error instanceof BillingError && error.code==="USAGE_ALREADY_SETTLED")) throw error;}
    }
    console.log("Recovered stale usage reservations:",recovered);
  } finally {await pool.end();}
}
main().catch(()=>{console.error("Usage recovery failed. Check database connectivity and schema permissions.");process.exitCode=1;});
