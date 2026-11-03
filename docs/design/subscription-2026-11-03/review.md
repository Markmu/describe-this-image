# Subscription and credit terms — 2026-11-03

## Accepted terms

- Pro Monthly: $9.90, 2,000 credits / 200 image generations per month.
- Pro Annual: $79.90, 3,000 credits / 300 image generations per month. Twelve separate monthly windows provide 36,000 credits / 3,600 generations per year.
- One image generation costs 10 credits and includes all four output formats.
- Starter stays $6.99 for 300 credits / 30 generations. No expiry.
- Guest allowance is 10 credits / one image; Google welcome allowance is 20 credits / two images per account, with no daily refill.
- Annual price equals $6.66 per month, rounded. It is 33% below twelve $9.90 payments and includes 50% more credits per monthly window than Pro Monthly. Generation cost at full annual allowance is $0.0222, rounded.

## Compatibility

Migration 004 adds an order credit snapshot. Existing annual orders retain 2,000 credits per month and their stored payment amounts; new annual orders store 3,000 credits per month and 7,990 cents. Delayed payments and renewals use the order snapshot. Stale checkout terms cannot be resumed as a new-price checkout.

Existing one-credit guest and two-credit welcome grants convert their remaining free-image allowance to the 10-credit denomination. Historical ledger rows remain; conversion entries reconcile balances. Refunds of reservations created before the migration account for converted free grants. Purchased and subscription balances retain their stored amounts.

## Validation

- Lint and production build passed.
- Image/security suite: 7 tests passed.
- Billing suite: 18 tests passed against isolated PostgreSQL database `describe_audit`, with no skips. Includes annual product amount/interval validation, twelve new annual grant windows, legacy annual snapshots, exact 10-credit deductions/refunds, insufficient balance, concurrent free limits, migration repeatability, balance reconciliation and pre-migration reservation refunds.
- All migrations executed twice against the isolated database.
- Browser: desktop and 390 CSS-pixel mobile pricing reviewed. No horizontal page overflow. Monthly card shows 200 generations / 2,000 credits; annual card shows $79.90 and 300 images / 3,000 credits per month. Pricing page console captured no errors.
- Homepage checked for $79.90 annual price, 200/300 generation allowances, 20-credit welcome offer and 10-credit generation button.
- Screenshots: [desktop](desktop.png), [mobile annual](mobile-annual.png), [mobile monthly](mobile-monthly.png).

## Deployment

The local application `DATABASE_URL`, Creem API key and webhook secret are unconfigured. Verification used an isolated database and mocked provider requests, not live merchant transactions.

Stop old application workers, run `pnpm db:migrate` against the target database, then start the new version. Configure a separate USD $79.90 yearly product and bind its ID using `CREEM_PRODUCT_PRO_YEAR`. Retain the old product for historical subscriptions. Product, amount, currency and period validation remain enforced.
