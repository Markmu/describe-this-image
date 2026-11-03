# SeeAPI NSFW integration verification

Date: 2026-11-04 (Asia/Shanghai)

## Checks

- `pnpm test`: 25 passed, 0 failed, 0 skipped.
- `pnpm lint`: passed.
- `pnpm exec tsc --noEmit`: passed; final production build also completed TypeScript validation.
- `pnpm build`: passed.
- `git diff --check`: passed.
- Production HTTP check with missing credentials: `/api/describe` returned 503 with `Cache-Control: no-store`.
- Privacy page: served HTTP 200 and disclosed SeeAPI processing and content restrictions.

## Browser checks

Ran against the production build on an isolated local server at port 3101. Browser response fixtures supplied usage, session and description results. These checks do not verify server authentication, database transactions or a live SeeAPI connection.

- Single-image rejection clears output, disables copying and generation, and preserves the displayed balance. A new upload restores generation.
- Batch rejection marks one image blocked and processes the next image.
- Adding an image and running the queue excludes the prior blocked item from resubmission.
- CSV contains two completed rows and excludes the blocked file.
- A moderation outage stops submission after the first image and leaves the remaining image pending.
- No JavaScript page errors occurred. Browser console HTTP errors correspond to the injected 422/503 responses.

Screenshots: [single rejection](nsfw-single-blocked.png), [batch rejection](nsfw-batch-continues.png), [moderation outage](nsfw-batch-unavailable.png).

## External verification

SeeAPI credentials are absent from this checkout. Provider requests, asynchronous results and credit workflow outcomes were validated with fixtures; no paid API request or real-database credit mutation was performed. Configure `SEEAPI_API_KEY` and the existing Gemini/database settings before a live end-to-end check. `SEEAPI_NSFW_THRESHOLD` defaults to 0.5, with special-care blocking enabled.
