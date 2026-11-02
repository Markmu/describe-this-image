# DescribeThisImage — visual redesign review
Date: 2026-11-02

## Direction and argument
Direction: The printed annual / editorial-report. Seed: 21219141. Type: Libre Franklin and Source Serif 4. Paper #e6e0d2, ink #1a1a1a and action green #18bc42. Supporting paper was neutralized to #eeece7 after inspection. No random redraws.

Idea: the site's four readings of an image become a contact sheet and an editable reading desk. The live interaction lets visitors select a photograph and read its caption, then explore four output formats in the working describer.

Subject inventory: the three-word product name; one guest image; ten daily signed-in descriptions; four output formats; eight languages; 50-image batch queue; 300 non-expiring Starter credits; 2,000 monthly Pro credits; $49.90 annual Pro; image-to-text comparison. Existing sample photography was available. No invented testimonials, users or performance figures.

Argument and copy deck:
- Every image. In words. → four real images and a selectable sample reading.
- Your image. Your words. → the working upload/URL/language/format interface.
- Give the image a little context. → choose, format, review; a link to the guide.
- A little. Or a lot. → annual Pro, Starter and monthly options, plus a link to full pricing including add-ons.
- A few things to know. → upload, free usage, image handling, languages and batches.

The pricing blueprint's two visual fields carry the annual offer and a link to the full existing pricing page; they do not replace the five-offer product contract.

## Screenshot review rounds

ROUND 1
Seen in one second: four photos and oversized image-to-words typography.
Idea: a contact sheet becomes a reading desk.
Live thing: choose a photograph; switch its reading format.
Layout words: hero=mosaic/axis / tool=reading-desk / method=run-in / pricing=two-fields / faq=question-index.
Scores: design 7.5 · usability 7 · creativity 7 · content 8 → overall 7.3.
Caps applied: screenshot defects prevented an award-level claim.
Top problems:
1. Phone mosaic auto-placement created holes; replace it with explicit grid areas.
2. White text lacked contrast on the watch; use ink-backed image controls.
3. FAQ wording exceeded two lines; shorten the language question.
The first development render also exposed stale CSS loader output. Replaced the custom Turbopack Tailwind loader with the documented PostCSS setup and checked the served stylesheet.

ROUND 2
Seen in one second: a full contact sheet followed by the two-line title.
Idea and live thing remain intact.
Scores: design 8 · usability 8 · creativity 7 · content 8 → overall 7.8.
Caps applied: originality is an interpretation of a known editorial approach.
Top problems:
1. Plan label read as an eyebrow over the price; move plan information into its description.
2. Phone output text was too large for sustained reading; reduce it to 21px.
3. Narrow sample labels and workspace heading were verbose; shorten them.

ROUND 3
Seen in one second: photography, a two-line headline and one green action.
Layout words: mosaic / reading desk / run-in / two-fields / questions.
Scores: design 8 · usability 8.5 · creativity 7 · content 8 → overall 7.95.
Caps applied: the concept can transfer to competing image tools; creativity remains 7.
Final source style lint: 0 failures, 0 warnings for the redesigned public page, navigation, masthead and footer.
Final real-browser inspector: 0 failures. Warnings and dispositions are listed below.
These are self-review scores, not jury scores or award certification. The requested absolute condition that no visible improvement can remain is not a verifiable design guarantee.

## Eight requested dimensions
| Dimension | Implementation and evidence |
| --- | --- |
| Typography | Libre Franklin display plus Source Serif 4 reading text; two-line hero at 1440, 768 and 390px; shortened narrow-screen headings. |
| Whitespace | Reused 42% axis; related text/control groups remain close; full-width tonal transitions distinguish sections. |
| Hierarchy | One hero, one primary upload destination, readable result sheet and a dominant annual price. |
| Color | Bone/ink fields, green actions, opaque image labels and visible keyboard focus. |
| Motion | Masked title, staggered image entrance, photograph drift, section entrances; reduced-motion override. |
| Micro-interaction | Photo selection, hover/press feedback, format selection, copy success, language mismatch notice, native FAQ expansion and Escape menu return. |
| Responsive | 1440/768/390px inspector screenshots; additional narrow viewport browser test measured 355px with no overflow and two-line h1/h2 headings. Browser overrides were reset. |
| Originality | The output itself is the visual material: contact sheet, side-by-side reading desk, editorial close. This remains a recognizable editorial design approach. |

## Inspector warnings retained with reasons
- Warm palette: bone comes from the drawn direction; the brighter secondary surface was neutralized.
- Font-size count: measurements include responsive display, price numerals and functional form labels; semantic roles remain display, section, lead, body and small.
- No footage: the licensed-media search for the image-to-description process returned no usable result; the photographic drift supplies living imagery without unrelated stock footage.
- Motion count: 13 distinct moving elements exceed the inspector's failure threshold. More movement would compete with reading.
- Phone edge alignment: the image mosaic reaches both viewport edges while reading text uses 20px gutters. Browser overflow is zero.

## Verification
- Next production build and ESLint passed.
- Seven existing image/input/HTTP/model tests passed.
- Browser verified photo selection changes sample reading; mode and language switching preserve accurate language labels.
- Copy displays success; uploading a fixture clears sample output and disables copy until a result exists.
- Mobile menu opens, Escape closes it and returns focus.
- Native FAQ expands its answer.
- Reduced-motion emulation reported zero animated elements, visible heading opacity 1 and zero horizontal overflow.
- Service credentials remain absent; this visual pass does not certify real OAuth, model or payment transactions.

## Reference limits
Awwwards, Webby and FWA were treated as the user's craft benchmark. Composition and evaluation use the installed design skill's research and critique rubric. Direct Awwwards case-page fetches timed out in this run; no claim is made that live winning entries were inspected or that their visual assets were reproduced.

## Photography
Four existing sample photographs are now served from public/images/editorial, without modifying the image pixels. The site footer credits Unsplash. Original source URLs:
- Portrait: https://images.unsplash.com/photo-1534528741775-53994a69daeb
- Landscape: https://images.unsplash.com/photo-1506744038136-46273834b3fb
- Watches: https://images.unsplash.com/photo-1523275335684-37898b6baf30
- Analytics: https://images.unsplash.com/photo-1551288049-bebda4e38f71

These are sample illustrations, not customer work or generated outputs. Individual creator metadata was not supplied by the previous implementation. No replacement media, fabricated testimonial or invented business proof was added.

## Artifacts
Final screenshots and measured report: [final/report.json](final/report.json), [desktop](final/desktop-fold.jpg), [tablet](final/tablet-fold.jpg), [phone](final/mobile-fold.jpg). Earlier rounds are retained for comparison.
