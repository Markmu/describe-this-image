# Service configuration

The local site runs with `pnpm dev` at http://localhost:3000. Sample previews work without service credentials. Image generation, authenticated usage and payments require the settings below; missing settings produce an unavailable state.

## Database and usage
Set DATABASE_URL to a PostgreSQL database owned by this application. Export it in the terminal and run `pnpm db:migrate`. The migration creates tables without dropping data. Back up a populated database before migrations. Development reads .env.local through Next.js; the standalone migration and recovery scripts require exported variables.

Guests receive one credit per signed browser identity. Each signed-in Google account receives 2 non-expiring welcome credits once. There is no daily refill. The guest allowance is separate. Clearing browser cookies can create another guest identity; this is not a person-level limit. Generation has a persistent hourly throttle (30 anonymous requests, 120 signed-in requests). Usage reads have a separate 300/hour throttle. Configure TRUSTED_CLIENT_IP_HEADER only when ingress overwrites that header; otherwise anonymous traffic shares a bucket. Enforce request size and traffic limits at ingress as well.

Apply migration 003_welcome_credits.sql before deploying this usage policy. It adds the welcome grant kind while retaining historical daily grants and ledger entries. Existing daily grants are excluded from available balances and spending. The first usage read under the policy grants 2 welcome credits to each account; later reads and later days do not grant more. Paid purchase and subscription credits are unaffected. Welcome credits are spent before paid credits.

Run `pnpm usage:recover` with DATABASE_URL exported to refund reservations left pending for more than five minutes after a process crash. Run this through the deployment scheduler. The model request timeout is 45 seconds; recovery processes up to 500 reservations per invocation.

## Google
Generate a private AUTH_SECRET (at least 32 characters), set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, and register:
- Development redirect: http://localhost:3000/api/auth/callback/google
- Deployment redirect: https://YOUR_DOMAIN/api/auth/callback/google

Set AUTH_URL and NEXT_PUBLIC_APP_URL to the intended origin. Enable AUTH_TRUST_HOST only behind ingress that validates and overwrites forwarded host headers. Rotate the former published development secret in every deployment; local configuration has been rotated without printing its value. Google accounts must have verified email. The server uses Google's subject identifier for ownership.

## Image descriptions
Set a private Gemini VISION_API_KEY and an explicit VISION_MODEL supporting image input and JSON structured responses. Select the model from your enabled Google project. The implementation sends a metadata-stripped PNG of at most 1536 pixels per side. Inputs support JPEG, PNG, WebP and GIF up to 10 MB / 40 megapixels. GIF generation uses the first frame. Review Google's processing and retention terms before publishing the privacy notice.

Remote image URLs are loaded by the browser with CORS, omitted credentials and blocked redirects. The server has no URL-fetch proxy. Image hosts must permit cross-origin browser reads.

## Creem
Set CREEM_ENVIRONMENT to test or live and use matching API key, signing secret and product IDs:
- CREEM_PRODUCT_STARTER: USD 699 cents ($6.99), one time, 300 non-expiring credits.
- CREEM_PRODUCT_PRO_MONTH: USD 990 cents, every month, 2,000 credits per month.
- CREEM_PRODUCT_PRO_YEAR: USD 4990 cents, every year, twelve monthly windows of 2,000 credits.

Add-on is retired: new checkout requests reject its offer ID. Keep historical orders and their provider records for fulfillment and refunds; already-purchased credits remain valid. The server reconciles Starter payments using each stored order amount, including the previous $9.99 price. Configure the current Starter product at 699 cents and bind its product ID through CREEM_PRODUCT_STARTER before enabling checkout.

Configure active products without trials, seat multipliers or discounts. The checkout validates product price, currency, billing type and interval. Unadvertised product configuration fails closed. Subscription credits expire at the next monthly boundary; annual credits do not become usable as a single 24,000-credit balance. Cancellation retains Pro access through the paid period. Refunds, including partial refunds, or disputes revoke the remaining credits for that transaction; consumed credits are not restored. Review partial refunds through support.

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
