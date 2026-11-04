# Account pages implementation · 2026-11-05

## Delivered behavior

- `/account/plans`: available credits and image-description count, source balances, historical purchase entitlements, current subscription access, monthly progress and next window, recent credit activity, pagination, and Starter checkout.
- `/account/billing`: subscription status and paid-through date, pending checkout status links, Creem portal, verified payment transactions including renewals, history pagination, and links back to credits.
- Account menu links to the new pages. Account tabs, refresh actions and a compact footer share the existing paper-and-ink design. The public footer returns on public routes.
- Server-side session checks protect both pages and history APIs. Login return destinations use an allowlist; both header and page sign-in controls preserve account destinations. Checkout login recovery returns to Plans and credits.
- Account pages and APIs disable shared caching. Account metadata and HTTP headers carry `noindex`; robots excludes `/account/`. Account routes remain outside the sitemap.
- Empty accounts, zero balances, loading, unavailable data, payment failures and history retries have dedicated states. Unavailable balances display an error rather than a fabricated zero.

## Data boundaries

- Available balance is computed from the same owner-scoped, non-revoked, active grants used by generation. Future annual windows remain outside the available balance. Historical Starter orders retain their stored entitlement.
- One reservation split over several grants appears as one debit; its refund appears as one credit. Inferred monthly window expiry carries no fabricated ledger amount.
- Billing summaries and payment queries filter order ownership and Creem environment. Credit grants retain the existing environment boundary: test and live require separate databases, as documented in SETUP.md.
- Payment amounts display “—” because the current schema lacks per-transaction charged amounts. Pending checkout amounts come from the order snapshot. Receipts, payment methods, billing addresses and cancellation stay in the verified Creem portal.
- Paid-through dates describe access, not a promised next charge. Canceled renewals retain access until the paid period ends.
- No schema migration or authentication bypass was introduced.

## Validation

- `pnpm test`: 25 passing tests.
- `pnpm test:billing`: 28 passing tests, including account return destinations, cursor validation, welcome-grant idempotency, zero balance, user isolation, environment filtering, legacy Starter credits, future annual windows, canceled access, grouped debit/refund entries and cursor pagination with microsecond ties.
- `pnpm lint`, `pnpm build`, and `git diff --check`: pass.
- Skill source lint: 0 FAIL, 0 WARN.
- Production browser checks: 1440, 768, 390 and 320px; no horizontal document overflow. Both pages have private no-store responses and noindex headers.
- Browser flow checks: anonymous page redirects and API 401; safe sign-in return from both page and header controls; rejected external return destination; account menu navigation; pending-order status link; history expansion, load-more, failure and retry; checkout offer and expired-session return; billing portal failure, retry and redirect; compact/public footer navigation.
- State checks: new account, empty payment history, zero credits with a purchase action, and unavailable PostgreSQL with block-level errors.
- Browser data used an isolated audit database and temporary signed test sessions. Checkout and portal responses used browser fixtures. No card was charged; Google authentication and Creem customer operations remain provider deployment acceptance checks.

## Design review

Direction: Achromatic ledger, seed `57019846`. Brand palette and type retained. The existing top navigation and two account tabs provide the frame; a new sidebar would duplicate these destinations. The inspector's `palette-cream` rule is allowed for the site's established paper surfaces.

Question: how many images can this account describe, and what controls its paid access?

Face: Libre Franklin and the site's paper surfaces; source grants and monthly windows form the product-specific ledger.

ROUND 3

1. The balance answers the plans page question first. The billing page places subscription state and portal controls in its first content row.
2. Shared outer edges and an 1120px content limit hold across both pages. Credit breakdown and activity share one divided surface on desktop and stack on narrower screens.
3. Real zeros and unknown amounts retain their meaning. No comparison percentages, revenue estimates or charts were invented.
4. The menu, tabs, checkout and portal use existing site conventions. Source progress uses each grant's stored allowance.
5. Four recent entries keep the overview compact; expanding history reveals the first 20 and loads further cursor pages.
6. Phone rows keep the product, date, status and amount placeholder. Credit sources keep the balance and expiry terms.
7. No shadows on account panels, tinted icon squares or decorative charts. The compact footer removes the marketing close from account pages.
8. No new stock images, sample customer claims or external visual assets were added. Screenshot accounts and transactions are verification fixtures.

Scores: design 8 · usability 8 · creativity 6.5 · content 8 → overall 7.7.

Corrections across review rounds: align the summary panels; combine source/activity panels to remove the stretched blank area; scope the compact footer by route so it does not affect pricing after navigation.

Final inspector results at 1440, 768 and 390px: Plans and credits **0 FAIL / 0 WARN**, Manage billing **0 FAIL / 0 WARN**, with the documented brand palette allowance. Every inspector screenshot was opened for review.

Remaining limits: transaction amount and receipt links require provider-backed transaction fields; those actions are available through Creem. No release or production payment operation is part of this change.

## Evidence

| Page | Desktop | Tablet | Phone | Narrow phone |
| --- | --- | --- | --- | --- |
| Plans and credits | [1440px](plans-1440.png) | [768px](plans-768.png) | [390px](plans-390.png) | [320px](plans-320.png) |
| Manage billing | [1440px](billing-1440.png) | [768px](billing-768.png) | [390px](billing-390.png) | [320px](billing-320.png) |

- [Plans inspector report](plans-report.json) · [desktop fold](plans-desktop-fold.jpg) · [phone fold](plans-mobile-fold.jpg)
- [Billing inspector report](billing-report.json) · [desktop fold](billing-desktop-fold.jpg) · [phone fold](billing-mobile-fold.jpg)
- [Zero credits](plans-zero.png) · [No billing history](billing-empty.png) · [Storage unavailable](plans-unavailable.png)
