# Batch, Guide and Pricing — shared visual system
Date: 2026-11-02

## Direction and scope
Continue the homepage's printed-annual direction (seed 21219141): Libre Franklin, Source Serif 4, paper #e6e0d2, ink #1a1a1a, action green #18bc42. No redraw or new dependency.

The three pages share a title frame, outer gutters, flat paper surfaces, square action buttons, focus treatment and motion fallback. Each keeps its own task: choosing a plan, reading a guide, or preparing an image queue.

The product inventory stays intact: one guest description, ten daily descriptions with Google, Starter $9.99/300 non-expiring credits, Pro $9.90/month or $49.90/year with 2,000 monthly credits, and $5/1,000 non-expiring add-on credits. Batch processing and CSV export require Pro. Monthly credit expiry remains visible.

## Page arguments
- Pricing: a year of Pro leads, followed by alternative plans, extra credits, image/output examples and the complete comparison.
- Guide: read a real image, identify visible details, choose a format, review alt text in context, then bring an image to the tool.
- Batch: bring source files, choose a language, process the queue and export completed results. The empty, pending and unavailable states describe the actual service state.

## Review rounds
ROUND 1
Seen in one second: the annual price, a photograph paired with its caption, and a source/queue workbench.
Idea: image reading connects the marketing pages to the working tool.
Live things: checkout entry, chapter anchors, image queue and language selection.
Layout words: Pricing=annual field / alternatives / comparison; Guide=photo-reading / chapter index; Batch=source / queue.
Top three problems:
1. Phone statements wrapped at display size; set them to 24px reading size and shorten the annual supporting line.
2. Pricing rights were dominated by small text; move features to 16px ink.
3. The guide explained formats without examples; pair all four with existing photographs and sample text.

ROUND 2
Seen in one second: a clear annual action and an image-first guide.
Top three problems:
1. The guide's body column stopped short of its grid; use the homepage's 42/58 axis.
2. Alternative prices competed with the annual offer; combine each name and price in a compact 24px heading.
3. Phone comparison needed labels and accessible headers; retain the semantic table and transform its rows into labeled vertical groups.

ROUND 3
Seen in one second: one annual offer, one photographic reading example, one batch job.
Final self-review:
- Pricing: design 8, usability 8, creativity 7, content 8 -> 7.8.
- Guide: design 8, usability 8, creativity 7, content 8.5 -> 7.85.
- Batch: task clarity, empty-state honesty, keyboard operation and mobile reflow checked; the title keeps the public site's display scale.
These are internal design judgments. The concept uses an established editorial approach.

The closing pass removed duplicate photo-category captions from Pricing; its introductory sentence and image alternatives carry that information.

## Verification
- ESLint and the production Next.js build pass.
- Source style lint: 0 failures and 0 warnings for the page/component sources; Batch checked in app mode.
- Seven existing image/input/HTTP/model tests pass.
- Real-browser production inspection at 1440, 768 and 390px. The final artifacts are in [subpages](subpages/).
- The Guide and Batch reports were retained after the closing Pricing-only adjustments.
- Browser: two local sample images enter the batch queue, individual removal updates the count, clearing restores the empty state, and Japanese/Italian selections update the control.
- Keyboard: ArrowDown/End/Enter chooses Italian on the phone layout.
- Guide chapter navigation reaches #alt-text with its heading 36px from the viewport top.
- At 390x844, the annual action occupies y=490..545px, compared with y=2319px in the previous layout.
- All three phone pages have zero document overflow. Pricing's comparison fits within its 350px content width.
- Reduced-motion emulation yields zero animated main-content elements and visible headings on the three pages.
- Browser console checks show no JavaScript errors in Guide/Batch.
- Checkout on the configured development origin (localhost:3000) leads an anonymous visitor to /billing/login. Google configuration is unavailable there. Real OAuth, model generation, paid processing and payment transactions are outside this visual verification.
- The isolated production preview uses port 3001. Checkout origin protection rejects that preview origin; its configuration and security checks were preserved.

## Retained inspector warnings
- The paper palette is inherited from the approved homepage direction.
- Fluid headings, price numerals, body copy and control labels create more measured sizes than the inspector's generic five-size budget; there are two loaded typefaces and distinct semantic roles.
- Eight entrance elements on the reading pages and control feedback keep motion restrained for reading and purchasing.
- Existing still photographs explain this image-to-text product; no unrelated stock video was introduced.
- Text-bound margin estimates include inline text and cell padding; page wrappers use symmetric gutters and the phone pages have no overflow.
- Pricing repeats actual plan/comparison records, so their consistent row shapes are deliberate.
- Batch's source and queue serve different jobs and change height with data. The empty state keeps the queue honest rather than inventing records.
- Batch's larger title maintains continuity with the public site; task controls stay compact.

## Media
Reused the four local sample photographs and their existing sample outputs. Source and inherited attribution limits are recorded in [the homepage review](review.md#photography). The shared footer credits Unsplash. No external media or customer claims were added.

## Measured before and after

| Page | Before FAIL | After FAIL | After WARN | Widths |
| --- | ---: | ---: | ---: | --- |
| Pricing | 12 | 0 | 6 | 1440, 768, 390px |
| Guide | 11 | 0 | 4 | 1440, 768, 390px |
| Batch | 0 | 0 | 4 | 1440, 768, 390px |
