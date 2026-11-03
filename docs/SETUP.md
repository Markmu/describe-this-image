# Service configuration

The local site runs with `pnpm dev` at http://localhost:3000. Sample previews work without service credentials. Image generation, authenticated usage and payments require the settings below; missing settings produce an unavailable state.

## Database and usage
Set DATABASE_URL to a PostgreSQL database owned by this application. Export it in the terminal and run `pnpm db:migrate`. The migration creates tables without dropping data. Back up a populated database before migrations. Development reads .env.local through Next.js; the standalone migration and recovery scripts require exported variables.

Each image generation costs 10 credits and returns all four description formats. Guests receive 10 credits (one image) per signed browser identity. Each signed-in Google account receives 20 non-expiring welcome credits (two images) once. There is no daily refill. The guest allowance is separate. Clearing browser cookies can create another guest identity; this is not a person-level limit. Generation has a persistent hourly throttle (30 anonymous requests, 120 signed-in requests). Usage reads have a separate 300/hour throttle. Configure TRUSTED_CLIENT_IP_HEADER only when ingress overwrites that header; otherwise anonymous traffic shares a bucket. Enforce request size and traffic limits at ingress as well.

Apply all migrations before deploying this usage policy. Migration 003 adds the welcome grant kind while retaining historical daily grants and ledger entries. Existing daily grants are excluded from available balances and spending. The first usage read grants welcome credits to each account; later reads and later days do not grant more. Welcome credits are spent before paid credits. Migration 004 converts the previous 1-credit guest and 2-credit welcome grants to the 10-credit image denomination, preserving the number of free images left. It retains prior ledger entries and adds balance conversion entries. Pending reservations created before migration retain their original denomination for refunds. Purchased and subscription balances keep their stored credit amounts.

Run `pnpm usage:recover` with DATABASE_URL exported to refund reservations left pending for more than five minutes after a process crash. Run this through the deployment scheduler. The safety check has a 30-second deadline, followed by a model request timeout of 45 seconds. The description route and browser allow 90 seconds; configure ingress and hosting limits to match. Recovery processes up to 500 reservations per invocation.

## Google
Generate a private AUTH_SECRET (at least 32 characters), set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, and register:
- Development redirect: http://localhost:3000/api/auth/callback/google
- Deployment redirect: https://YOUR_DOMAIN/api/auth/callback/google

Set AUTH_URL and NEXT_PUBLIC_APP_URL to the intended origin. Enable AUTH_TRUST_HOST only behind ingress that validates and overwrites forwarded host headers. Rotate the former published development secret in every deployment; local configuration has been rotated without printing its value. Google accounts must have verified email. The server uses Google's subject identifier for ownership.

## Image descriptions
Set a private Gemini VISION_API_KEY and an explicit VISION_MODEL supporting image input and JSON structured responses. Select the model from your enabled Google project. The implementation sends a metadata-stripped PNG of at most 1536 pixels per side. Inputs support JPEG, PNG, WebP and GIF up to 10 MB / 40 megapixels. GIF generation uses the first frame. Review Google's processing and retention terms before publishing the privacy notice.

Remote image URLs are loaded by the browser with CORS, omitted credentials and blocked redirects. The server has no URL-fetch proxy. Image hosts must permit cross-origin browser reads.

## SeeAPI image safety
Set a private `SEEAPI_API_KEY`. Every generated description requires a successful [SeeAPI NSFW Filter 2.0 image moderation check](https://www.seeapi.com/docs/nsfw-filter-2/image-moderation/). Missing credentials or an invalid threshold disable generation, including batch processing. Sample previews remain available.

`SEEAPI_NSFW_THRESHOLD` defaults to `0.5` and accepts finite values from `0.01` to `0.99`; lower values tighten detection. `strict_special_care` is fixed to `true`. The policy blocks flagged results and any `nudity`, `sexual_activity`, `sexual_suggestive` or `sexual_minors` labels. Medical, breastfeeding and artistic images can be blocked under this policy.

After input validation and credit reservation, the server creates a metadata-free 1536 × 1536 PNG copy with a white background and letterboxing. This preserves the frame, supports small and narrow inputs, and fits the provider's recommended dimensions, pixel count and file limit. Original URLs are not sent to SeeAPI. Requests use `POST https://api.seeapi.com/v1/inferences`, the reservation ID as the basis of a stable `Idempotency-Key`, and the model/endpoint/provider identifiers `nsfw-filter-2` / `image-moderation` / `seeapi`. The server polls `GET /v1/inferences/{id}` with backoff, honors `Retry-After`, and accepts only a terminal `succeeded` task with a valid, unflagged JSON result and empty category arrays. A processing task or null result never counts as a pass.

Blocked images return HTTP 422 with `CONTENT_BLOCKED`. Provider failures, malformed responses and timeouts return HTTP 503 with `MODERATION_UNAVAILABLE`. Both stop the Gemini call and refund the credit reservation. In a batch, a content rejection marks the image blocked and continues the queue; blocked entries are excluded from retries and CSV exports. A safety service failure stops the queue. Existing hourly throttles apply to rejected attempts. The application persists no moderation images or results and logs no provider payloads. Review SeeAPI's processing and retention terms for deployment.

Contract and workflow tests use fixtures without paid API calls. This checkout has no SeeAPI credentials; a live check remains a deployment verification step.

## Creem
Set CREEM_ENVIRONMENT to test or live and use matching API key, signing secret and product IDs:
- CREEM_PRODUCT_STARTER: USD 699 cents ($6.99), one time, 300 non-expiring credits (30 images).
- CREEM_PRODUCT_PRO_MONTH: USD 990 cents ($9.90), every month, 2,000 credits per month (200 images).
- CREEM_PRODUCT_PRO_YEAR: USD 7990 cents ($79.90), every year, twelve monthly windows of 3,000 credits (300 images per month, 3,600 per year).

Add-on is retired: new checkout requests reject its offer ID. Keep historical orders and their provider records for fulfillment and refunds; already-purchased credits remain valid. The server reconciles Starter payments using each stored order amount, including the previous $9.99 price. Configure the current Starter product at 699 cents and bind its product ID through CREEM_PRODUCT_STARTER before enabling checkout.

Migration 004 snapshots each existing order's credit entitlement in `billing_orders.credit_amount`. Previous $49.90 annual orders retain twelve windows of 2,000 credits. New $79.90 annual orders snapshot 3,000 credits per monthly window. Renewals and delayed webhooks use the stored order price and credit amount. Do not reprice or rebind historical provider orders. A pending checkout with old terms is not resumed as a new-price checkout.

For this schema upgrade, stop old application workers before running `pnpm db:migrate`, then start the new version. Old checkout writers do not populate the required order-credit snapshot. Keep the old Creem annual product for existing subscriptions and configure a separate $79.90 annual product for new checkouts.

Configure active products without trials, seat multipliers or discounts. The checkout validates product price, currency, billing type and interval. Unadvertised product configuration fails closed. Subscription credits expire at the next monthly boundary; annual credits do not become usable as a single 36,000-credit balance. Cancellation retains Pro access through the paid period. Refunds, including partial refunds, or disputes revoke the remaining credits for that transaction; consumed credits are not restored. Review partial refunds through support.

Register the POST webhook https://YOUR_DOMAIN/api/webhooks/creem for checkout.completed, subscription.paid, subscription.active, subscription.canceled, subscription.scheduled_cancel, subscription.past_due, subscription.unpaid, subscription.expired, subscription.update, subscription.paused, refund.created and dispute.created. Do not use checkout redirects to grant credits.

The webhook verifies raw-body HMAC, reads provider evidence, binds local order/product/environment/customer, and writes events, transactions and credit grants in one database transaction. Retries return duplicate acknowledgments without repeating grants. Unknown payment reversals return a retryable error while reconciliation is pending. Paid subscriptions use subscription.paid. A pending checkout with a known URL can be resumed for the same Pro offer; an uncertain provider failure requires receipt/order reconciliation before starting another subscription.

Use Manage billing in the signed-in account menu or the portal link in a Creem receipt. The portal route chooses the authenticated user's stored customer identifier; clients cannot supply another customer.

Before accepting live payments, exercise Google login, initial payment, duplicate webhook delivery, renewal, canceled access through period end, refund, dispute and portal cancellation in Creem test mode. Credentials are absent in this checkout; these external flows have not been exercised.

## Checks
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `TEST_DATABASE_URL=postgresql://.../describe_audit pnpm test:billing`

Billing tests require an isolated database whose name begins with describe_audit; apply migrations to it first. Provider requests use fixtures and assert method, URL and payload; they do not charge a card.
