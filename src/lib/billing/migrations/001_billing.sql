BEGIN;
CREATE TABLE IF NOT EXISTS billing_orders (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  offer_id text NOT NULL CHECK (offer_id IN ('starter','pro-month','pro-year','addon-1000')),
  product_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  checkout_id text UNIQUE,
  checkout_url text,
  customer_id text,
  subscription_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);
CREATE INDEX IF NOT EXISTS billing_orders_user ON billing_orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS billing_orders_subscription ON billing_orders(subscription_id);
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES billing_orders(id),
  product_id text NOT NULL,
  customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  paid_through timestamptz NOT NULL,
  last_event_at bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS billing_payments (
  transaction_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES billing_orders(id),
  subscription_id text,
  period_start timestamptz,
  period_end timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_period ON billing_payments(subscription_id, period_start) WHERE subscription_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS billing_events (
  id text PRIMARY KEY,
  body_hash text NOT NULL,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS credit_grants (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('guest','daily','purchase','subscription')),
  amount integer NOT NULL CHECK (amount > 0),
  remaining integer NOT NULL CHECK (remaining >= 0 AND remaining <= amount),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz,
  payment_id text REFERENCES billing_payments(transaction_id),
  revoked boolean NOT NULL DEFAULT false,
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);
CREATE INDEX IF NOT EXISTS credit_grants_owner ON credit_grants(owner_id, starts_at, expires_at);
CREATE TABLE IF NOT EXISTS usage_reservations (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  request_id text NOT NULL,
  units integer NOT NULL CHECK (units > 0),
  batch boolean NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved','completed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, request_id)
);
CREATE TABLE IF NOT EXISTS usage_allocations (
  reservation_id uuid NOT NULL REFERENCES usage_reservations(id),
  grant_id text NOT NULL REFERENCES credit_grants(id),
  amount integer NOT NULL CHECK (amount > 0),
  PRIMARY KEY (reservation_id, grant_id)
);
CREATE TABLE IF NOT EXISTS credit_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grant_id text NOT NULL REFERENCES credit_grants(id),
  reference_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('grant','reserve','refund','revoke')),
  delta integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grant_id, reference_id, kind)
);
COMMIT;
