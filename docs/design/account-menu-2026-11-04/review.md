# Account menu review · 2026-11-04

## Scope

- Component restyle using the existing paper, ink and Libre Franklin system; no direction draw or palette change.
- Avatar in the trigger and identity block. Google session images have a name-initial fallback for missing images and load failures.
- Grouped plans/billing actions, neutral sign-out action, 44px touch targets, hover and focus states.
- Phone navigation uses an inline account panel and a viewport-height scroll limit.
- Escape closes the account panel and restores trigger focus without closing the parent phone navigation. Tab out, outside click and plans navigation close the panel.
- Portal and sign-out actions share a request lock. Busy actions use `aria-disabled` to retain focus: native disabling caused blur to close the panel and hide portal errors.
- The two account pages have a [planning document](../account-pages-plan-2026-11-04.md). Plans still opens pricing; billing still opens the Creem portal.

## Validation

- `pnpm lint`, `pnpm build` and `git diff --check`: pass.
- Skill source lint on `UserAuthButton.tsx`: 0 FAIL, 0 WARN.
- Playwright component inspection against the production server: 1440, 768, 390 and 320px. No document overflow; account panels remain inside the viewport.
- Keyboard checks: opening, plans/billing/sign-out tab order, tab-out closing, Escape and focus restoration. Parent phone navigation stays open after account Escape.
- Browser fixtures cover image success, missing image, failed image, portal failure with visible error and retry, successful portal redirect, duplicate-request suppression and sign-out returning to the anonymous state.
- Auth and payment responses use browser route fixtures. No Google login or Creem transaction took place. Alex Morgan and its email are preview fixtures; the avatar-load screenshot uses the existing editorial portrait asset as a loading fixture.
- Final width screenshots use reduced motion for stable capture. Hover and chevron transitions retain the site's reduced-motion fallback.

## Visual review

ROUND 1

Seen in one second: account identity followed by three actions.

Idea: the account panel follows the site's paper-and-ink reading surface.

Live thing: session avatar and working account actions.

Layout words by section: identity=row / plans and billing=list / sign-out=separate row.

Scores: design 8 · usability 8 · creativity 6 · content 8 → overall 7.6.

Caps applied: component scope; existing design retained. Page imagery and hero criteria do not apply.

Top three problems in the before screenshot and fixes:

1. Identity lacks an avatar: add profile images with initials fallback.
2. Underlined links, blue billing text and red sign-out compete: use aligned action rows with neutral outline icons.
3. The popup has a different white surface and corner treatment: use existing paper tones, a compact floating panel and an inline phone layout.

Remaining limit: account-page summaries require the data work described in the planning document.

## Screenshots

- [Before](before.png)
- [Desktop](desktop.png)
- [Tablet](width-768.png)
- [Phone](width-390.png)
- [Narrow phone](width-320.png)
- [Avatar loading fixture](avatar.png)
- [Portal failure](billing-error.png)
- [Component preview](preview.png)
