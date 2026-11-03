# Pricing and welcome-credit update — 2026-11-03

## Product terms

- Guest: one credit per signed browser identity.
- Google account: one grant of two welcome credits, with no expiry or daily refill. Existing accounts receive the grant on their first usage read under this policy.
- Starter Pack: $6.99 for 300 credits, with no expiry or recurring payment.
- Pro Monthly and Pro Annual: unchanged.
- Add-on: removed from public pricing and rejected by new checkout requests. Historical fulfillment, refunds and purchased balances remain supported.
- Historical daily grants and ledger entries remain in the database. Daily grants are excluded from the spendable balance under this policy.

## Validation

- `pnpm lint`: passed.
- `pnpm build`: passed, including TypeScript and 21 generated routes.
- `pnpm test`: 7 passed.
- `pnpm test:billing`: 14 passed against the isolated `describe_audit` PostgreSQL database. Coverage includes concurrent welcome-credit consumption, no refill, refund idempotency, historical daily grants, legacy Starter payments and retired Add-on fulfillment/refunds.
- `pnpm db:migrate`: migration applied and repeat execution passed against the isolated database.
- Browser: desktop pricing reviewed; mobile document width and viewport width both measured 390 CSS pixels. Four comparison rows remain. No browser console errors were captured.
- Screenshots: [desktop](desktop.png), [mobile](mobile.png).

## Deployment dependencies

The application database and Creem credentials are not configured in the local environment used for this review. No merchant configuration, live transaction or application-database migration was performed.

1. Export the target `DATABASE_URL` and run `pnpm db:migrate` before deploying the usage-policy code. Migration `003_welcome_credits.sql` adds the welcome grant kind without deleting history.
2. Configure a USD 699-cent, one-time Starter product in Creem and set its ID through `CREEM_PRODUCT_STARTER`. Checkout rejects a product whose price differs from the catalog.
3. Keep historical order/provider records for webhook reconciliation and refunds.
