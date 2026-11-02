CREATE TABLE IF NOT EXISTS request_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0)
);
