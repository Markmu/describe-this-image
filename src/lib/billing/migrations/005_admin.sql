BEGIN;
CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  email text,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  historical boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','banned')),
  ban_reason text
);
CREATE INDEX IF NOT EXISTS app_users_email ON app_users(lower(email));
CREATE INDEX IF NOT EXISTS app_users_created ON app_users(created_at,id);
INSERT INTO app_users(id,created_at,historical)
  SELECT user_id,min(created_at),true FROM billing_orders GROUP BY user_id ON CONFLICT DO NOTHING;
INSERT INTO app_users(id,created_at,historical)
  SELECT substring(owner_id FROM 6),min(starts_at),true FROM credit_grants
  WHERE owner_id LIKE 'user:%' GROUP BY owner_id ON CONFLICT DO NOTHING;

ALTER TABLE credit_grants DROP CONSTRAINT IF EXISTS credit_grants_kind_check;
ALTER TABLE credit_grants ADD CONSTRAINT credit_grants_kind_check
  CHECK (kind IN ('guest','welcome','daily','purchase','subscription','compensation'));

CREATE TABLE IF NOT EXISTS admin_audit (
  id uuid PRIMARY KEY,
  actor_id text NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  reason text NOT NULL,
  request_hash text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}',
  result text NOT NULL CHECK (result IN ('succeeded','failed')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created ON admin_audit(created_at,id);
CREATE INDEX IF NOT EXISTS admin_audit_target ON admin_audit(target,created_at);

CREATE TABLE IF NOT EXISTS generation_requests (
  id uuid PRIMARY KEY,
  client_request_id text,
  owner_id text,
  reservation_id uuid REFERENCES usage_reservations(id),
  language text,
  batch boolean NOT NULL DEFAULT false,
  units integer NOT NULL DEFAULT 1 CHECK (units > 0),
  model text,
  stage text NOT NULL DEFAULT 'received',
  result text NOT NULL DEFAULT 'processing',
  error_code text,
  moderation text,
  stages jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer
);
CREATE INDEX IF NOT EXISTS generation_requests_created ON generation_requests(created_at,id);
CREATE INDEX IF NOT EXISTS generation_requests_owner ON generation_requests(owner_id,created_at,id);
CREATE INDEX IF NOT EXISTS generation_requests_result ON generation_requests(result,created_at,id);
CREATE INDEX IF NOT EXISTS generation_requests_client ON generation_requests(client_request_id);
CREATE INDEX IF NOT EXISTS generation_requests_reservation ON generation_requests(reservation_id);

ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS amount_paid integer CHECK (amount_paid >= 0);
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS refunded_amount integer CHECK (refunded_amount >= 0);
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS evidence_at timestamptz;
ALTER TABLE billing_payments ADD COLUMN IF NOT EXISTS provider_status text;
CREATE TABLE IF NOT EXISTS payment_refunds (
  event_id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES billing_payments(transaction_id),
  amount integer NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_refunds_time ON payment_refunds(occurred_at,event_id);

CREATE TABLE IF NOT EXISTS webhook_attempts (
  id uuid PRIMARY KEY,
  event_id text,
  event_type text,
  order_id text,
  result text NOT NULL CHECK (result IN ('succeeded','duplicate','failed')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_attempts_created ON webhook_attempts(created_at,id);
CREATE INDEX IF NOT EXISTS webhook_attempts_event ON webhook_attempts(event_id,created_at);

CREATE TABLE IF NOT EXISTS operation_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  pause_generation boolean NOT NULL DEFAULT false,
  pause_checkout boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO operation_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS operation_tasks (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL CHECK(status IN ('running','succeeded','failed')),
  processed integer NOT NULL DEFAULT 0,
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS operation_tasks_time ON operation_tasks(started_at,id);
CREATE TABLE IF NOT EXISTS operation_cases (
  source_type text NOT NULL CHECK(source_type IN ('order','webhook','request','reservation','task')),
  source_id text NOT NULL,
  status text NOT NULL CHECK(status IN ('open','processing','resolved')),
  note text NOT NULL,
  actor_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(source_type,source_id)
);
CREATE TABLE IF NOT EXISTS operation_probes (
  service text PRIMARY KEY,
  status text NOT NULL CHECK(status IN ('passed','failed')),
  checked_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
