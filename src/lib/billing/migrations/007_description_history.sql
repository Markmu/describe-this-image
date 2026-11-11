BEGIN;

-- Snapshot the entitlement when a request starts, so expiration cannot revoke retention.
ALTER TABLE usage_reservations ADD COLUMN history_permanent boolean NOT NULL DEFAULT false;
ALTER TABLE generation_requests ADD COLUMN history_permanent boolean NOT NULL DEFAULT false;

CREATE TABLE description_history (
  id uuid PRIMARY KEY REFERENCES usage_reservations(id),
  owner_id text NOT NULL,
  language text NOT NULL,
  batch boolean NOT NULL,
  outputs jsonb NOT NULL CHECK (
    jsonb_typeof(outputs) = 'object'
    AND outputs ?& ARRAY['detailed','short','alt','social']
    AND jsonb_typeof(outputs->'detailed') = 'string'
    AND jsonb_typeof(outputs->'short') = 'string'
    AND jsonb_typeof(outputs->'alt') = 'string'
    AND jsonb_typeof(outputs->'social') = 'string'
  ),
  permanent boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX description_history_owner ON description_history(owner_id,created_at DESC,id DESC);
CREATE INDEX description_history_expiring ON description_history(created_at) WHERE NOT permanent;

COMMIT;
