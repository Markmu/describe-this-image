BEGIN;
-- Keep historical daily grants and their ledger entries for reconciliation.
-- Current usage accepts welcome, guest, purchase and subscription grants.
ALTER TABLE credit_grants DROP CONSTRAINT IF EXISTS credit_grants_kind_check;
ALTER TABLE credit_grants ADD CONSTRAINT credit_grants_kind_check
  CHECK (kind IN ('guest','welcome','daily','purchase','subscription'));
COMMIT;
