# Creem sandbox verification — 2026-11-10

Store: DescribeThisImage. Environment: test. Application: `http://localhost:3000`. Development database: `describe_local`; integration-test database: `describe_audit`. Both databases use PostgreSQL at `127.0.0.1:5434`.

## Configuration

| Offer | Product ID | Price | Credit entitlement |
| --- | --- | --- | --- |
| Starter Pack | `prod_6vneEykfWfTP8xfCcNbAVE` | USD 6.99 once | 500 credits, no expiry |
| Pro Monthly | `prod_3xxfZRmLDZL37bMjWzzlle` | USD 9.90 per month | 2,000 credits per monthly window |
| Pro Annual | `prod_5etMT77bQIIRj2H6UXsf0B` | USD 79.90 per year | Twelve monthly windows of 3,000 credits |

Products use inclusive tax pricing, the SaaS tax category, and no trial. Product prices, active status, environment and intervals passed the application's provider validation against the test API. API credentials, the signing secret and product bindings are in the Git-ignored `.env.local`.

The persistent webhook `wh_test_6vljKtbWaIEuwEutNZuBdF` uses CLI delivery mode and the twelve events listed in `docs/SETUP.md`. Start `pnpm dev` and `pnpm billing:listen` in separate terminals. The listener forwards signed bodies to `/api/webhooks/creem`; the wrapper excludes the signing secret from its output. The endpoint persists when the listener stops.

References: [Creem test mode](https://docs.creem.io/getting-started/test-mode), [local webhook listener](https://docs.creem.io/code/cli#local-webhooks).

## External sandbox checks

| Scenario | Observed result | Evidence |
| --- | --- | --- |
| Declined test card | Creem displayed the decline; the local order stayed pending with zero payments | [Screenshot](starter-declined.png) |
| Starter payment | Signed webhook returned HTTP 200; the success page confirmed payment; account balance increased by 500 | [Confirmation](starter-confirmed.png), [credits](starter-credits.png) |
| Starter refund | USD 6.99 refund recorded; purchase grant revoked with zero remaining credits | [Database and replay evidence](starter-refund-replay.json) |
| Payment replay after refund | Dashboard resend created a new event ID for the same checkout; handler returned HTTP 200; the existing 500-credit grant stayed revoked with zero remaining | [Replay evidence](starter-refund-replay.json) |
| Monthly payment | USD 9.90 payment recorded; 2,000-credit window and Pro access granted | [Confirmation](monthly-confirmed.png), [credits](monthly-credits.png), [database](monthly-evidence.json) |
| Billing portal | Account's portal opened and displayed the Starter order and monthly subscription | Portal cancellation completed through the browser |
| Monthly cancellation | Portal cancellation produced `subscription.canceled`; access and 2,000 credits remained through December 10 | [Screenshot](monthly-canceled.png), [database](monthly-cancellation.json) |
| Monthly refund | USD 9.90 refund revoked the grant and ended paid access | [Screenshot](monthly-refunded.png) |
| Annual payment | USD 79.90 payment recorded; 12 windows totaled 36,000 credits; current allowance was 3,000 and future allowance was 33,000 | [Confirmation](annual-confirmed.png), [credits](annual-credits.png), [database](annual-evidence.json) |
| Annual cancellation and refund | Subscription canceled; USD 79.90 refunded; all twelve credit windows revoked | [Final database assertions](summary.json) |
| Invalid webhook signature | Local endpoint returned HTTP 401 with `INVALID_SIGNATURE` | [Summary](summary.json) |

Eleven provider deliveries passed: four checkout events, two subscription payment events, two cancellation events and three refund events. The fourth checkout event is the dashboard payment replay. The account returned to its pre-test balance of 10 welcome credits; both test subscriptions are canceled and have no paid access. One abandoned sandbox order from the initial rejected checkout response was marked failed, guarded by its test environment, missing checkout binding and absence of payments. Order, payment, refund and ledger history remain available.

Final browser evidence: [webhook delivery dashboard](webhook-deliveries.png), [restored account balance](final-balance.png).

## Fix discovered during verification

Creem's checkout-creation response omitted `request_id`. Retrieving that checkout returned the request ID, product and pending status. The gateway fetches the checkout when the creation response omits the request ID, then validates the order binding before returning the checkout URL. A regression test covers the omitted field and rejection of a foreign order binding.

The CLI product-creation request returned HTTP 400; the products were created through the documented REST API. The CLI listener, refund and cancellation operations completed against the test environment.

## Repository checks

- `pnpm test`: 29 passed.
- `pnpm test:billing`: 35 passed, including the checkout response regression and isolated database cases for exact duplicate events, renewals and historical entitlements.
- `pnpm test:admin`: 12 passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.
- `git diff --check`: passed.

Scope exclusions: production payments and deployment, provider renewals across elapsed billing periods, real disputes and partial refunds. The current results establish the sandbox flows listed above.
