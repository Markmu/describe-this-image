# Pricing layout and image-description copy — 2026-11-04

## Changes

- Free, Starter Pack, Pro Monthly and Pro Annual share one card grid. Desktop uses four columns, tablet uses two and phone uses one.
- Plan names, prices, credit allowances and action buttons share aligned positions. Pro Annual retains the ink background and green action.
- Removed per-credit and per-description monetary estimates, annual monthly-price equivalents and the duplicate row-based comparison table. Removed their unused calculation constants and styles.
- Pricing copy describes image descriptions, alt text and captions. Homepage, batch page, detailed-description page and service errors use the same product terminology.
- Prices, credit allowances, checkout offer IDs and billing behavior retain the accepted terms.

## Validation

- Browser widths: 1422 CSS pixels (four cards in one row with aligned action positions), 768 (two columns), 390 and 320 (one column). Document width equaled viewport width at each inspected size.
- Pricing DOM contains no image-generation wording or monetary unit estimates. Cards show $0, $6.99, $9.90 and $79.90, with the existing 1/30/200/300-image allowances and relevant credit periods.
- Annual checkout for an anonymous visitor reaches the Google sign-in page. Google credentials are unconfigured locally; no provider transaction was attempted.
- Screenshot review includes the desktop card grid, tablet and phone layouts.
- `pnpm lint`, `pnpm build`, `pnpm test` (7 tests) and `git diff --check` passed for this change.
- Billing integration tests from the preceding subscription update were not rerun for this presentation change.

## Evidence

- [Before](before.png)
- [Desktop cards](desktop.png)
- [Desktop page](desktop-full.png)
- [Tablet](tablet.png)
- [Phone annual card](mobile.png)
- [Phone page](mobile-full.png)
