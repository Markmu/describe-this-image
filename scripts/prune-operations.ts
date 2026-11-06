import { getBillingPool } from "../src/lib/billing/db";
import { pruneOperationalMetadata } from "../src/lib/admin/recovery";

pruneOperationalMetadata().then(result => console.log("Pruned operational metadata:", result))
  .catch(() => { console.error("Operational metadata pruning failed."); process.exitCode = 1; })
  .finally(() => getBillingPool().end());
