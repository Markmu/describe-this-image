BEGIN;

-- Retention follows current paid access rather than an entitlement captured at creation.
ALTER TABLE description_history DROP COLUMN permanent;
ALTER TABLE usage_reservations DROP COLUMN history_permanent;
ALTER TABLE generation_requests DROP COLUMN history_permanent;

CREATE INDEX description_history_created ON description_history(created_at);
CREATE INDEX billing_subscriptions_history_access ON billing_subscriptions(user_id,paid_through)
  WHERE status IN ('active','canceled','scheduled_cancel');

COMMIT;
