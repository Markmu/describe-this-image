BEGIN;
-- Source keys are HMACs of trusted IPv4 addresses or IPv6 /64 networks.
-- Keep claims with the quota ledger: deleting one reopens guest allowance issuance.
CREATE TABLE IF NOT EXISTS guest_allowance_claims (
  source_key text PRIMARY KEY CHECK (source_key ~ '^[0-9a-f]{64}$'),
  owner_id text NOT NULL UNIQUE CHECK (owner_id LIKE 'guest:%'),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
