BEGIN;
-- Preserve the credit entitlement agreed when each existing order was created.
ALTER TABLE billing_orders ADD COLUMN IF NOT EXISTS credit_amount integer CHECK (credit_amount > 0);
UPDATE billing_orders SET credit_amount = CASE offer_id
  WHEN 'starter' THEN 300 WHEN 'addon-1000' THEN 1000 ELSE 2000 END
  WHERE credit_amount IS NULL;
ALTER TABLE billing_orders ALTER COLUMN credit_amount SET NOT NULL;

-- Old reservations retain their charge denomination for failure refunds.
ALTER TABLE usage_reservations ADD COLUMN IF NOT EXISTS credits_per_image integer NOT NULL DEFAULT 1
  CHECK (credits_per_image > 0);
WITH converted AS (
  UPDATE credit_grants SET amount=amount*10,remaining=remaining*10
  WHERE (kind='guest' AND amount=1) OR (kind='welcome' AND amount=2)
  RETURNING id,remaining
)
INSERT INTO credit_ledger(grant_id,reference_id,kind,delta)
  SELECT id,'free-denomination-10:' || id,'grant',remaining-remaining/10
  FROM converted WHERE remaining > 0;
COMMIT;
