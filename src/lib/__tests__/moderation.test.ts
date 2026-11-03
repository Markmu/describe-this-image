import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { assertImageAllowed, moderationReady } from "../moderation";

const previous = { key: process.env.SEEAPI_API_KEY, threshold: process.env.SEEAPI_NSFW_THRESHOLD };
beforeEach(() => {
  process.env.SEEAPI_API_KEY = "fixture-secret";
  delete process.env.SEEAPI_NSFW_THRESHOLD;
});
afterEach(() => {
  if (previous.key === undefined) delete process.env.SEEAPI_API_KEY; else process.env.SEEAPI_API_KEY = previous.key;
  if (previous.threshold === undefined) delete process.env.SEEAPI_NSFW_THRESHOLD; else process.env.SEEAPI_NSFW_THRESHOLD = previous.threshold;
});

async function image(width = 4, height = 4) {
  const png = await sharp({ create: { width, height, channels: 4, background: "#4169e180" } }).withMetadata().png().toBuffer();
  return { mimeType: "image/png", data: png.toString("base64") };
}

function result(flagged = false, nsfw: string[] = [], specialCare: string[] = []) {
  return { type: "json", data: { flagged, categories: { nsfw, special_care: specialCare } } };
}

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task_fixture", object: "inference", model: "nsfw-filter-2", endpoint: "image-moderation", provider: "seeapi",
    status: "succeeded", consumed_credits: 0.2, result: result(), error: null, ...overrides,
  };
}

test("SeeAPI contract creates an idempotent task and polls the bound ID until completion", async () => {
  const input = await image();
  const requests: { url: string; method?: string }[] = [];
  const waits: number[] = [];
  process.env.SEEAPI_NSFW_THRESHOLD = "0.4";
  await assertImageAllowed(input, "reservation-123", {
    wait: async milliseconds => { waits.push(milliseconds); },
    transport: async (url, init) => {
      requests.push({ url: String(url), method: init?.method });
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), "Bearer fixture-secret");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal instanceof AbortSignal);
      if (requests.length === 1) {
        assert.equal(headers.get("idempotency-key"), "nsfw-reservation-123");
        assert.equal(headers.get("content-type"), "application/json");
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(Object.keys(body).sort(), ["endpoint", "input", "model", "provider"]);
        assert.equal(body.model, "nsfw-filter-2");
        assert.equal(body.endpoint, "image-moderation");
        assert.equal(body.provider, "seeapi");
        assert.equal(body.input.threshold, 0.4);
        assert.equal(body.input.strict_special_care, true);
        assert.match(body.input.image_url, /^data:image\/png;base64,/);
        const bytes = Buffer.from(body.input.image_url.split(",")[1], "base64");
        const metadata = await sharp(bytes).metadata();
        assert.equal(metadata.width, 1536);
        assert.equal(metadata.height, 1536);
        assert.equal(metadata.exif, undefined);
        assert.equal(metadata.hasAlpha, false);
        assert.ok(bytes.length <= 16_777_216);
        return Response.json(task({ status: "processing", result: null, consumed_credits: 0 }), { status: 202, headers: { "Retry-After": "2" } });
      }
      assert.equal(init?.body, undefined);
      if (requests.length === 2) return Response.json(task({ status: "processing", result: null }), { headers: { "Retry-After": "3" } });
      return Response.json(task());
    },
  });
  assert.deepEqual(requests, [
    { method: "POST", url: "https://api.seeapi.com/v1/inferences" },
    { method: "GET", url: "https://api.seeapi.com/v1/inferences/task_fixture" },
    { method: "GET", url: "https://api.seeapi.com/v1/inferences/task_fixture" },
  ]);
  assert.deepEqual(waits, [2000, 3000]);
});

test("small and narrow images meet SeeAPI dimensions without cropping the frame", async () => {
  for (const [width, height] of [[4, 4], [1, 1536], [1536, 1], [1536, 1024]]) {
    await assertImageAllowed(await image(width, height), "shape-fixture", {
      transport: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const { data, info } = await sharp(Buffer.from(body.input.image_url.split(",")[1], "base64")).raw().toBuffer({ resolveWithObject: true });
        assert.equal(info.width, 1536);
        assert.equal(info.height, 1536);
        const centers = [[767, 767], [767, 768], [768, 767], [768, 768]];
        assert.ok(centers.some(([x, y]) => {
          const offset = (y * info.width + x) * info.channels;
          return [...data.subarray(offset, offset + 3)].some(channel => channel !== 255);
        }));
        return Response.json(task());
      },
    });
  }
});

test("terminal idempotent replays succeed without polling and preserve request identity", async () => {
  const input = await image();
  const bodies: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    await assertImageAllowed(input, "same-reservation", {
      wait: async () => { assert.fail("A completed replay must not poll"); },
      transport: async (_url, init) => {
        assert.equal(new Headers(init?.headers).get("idempotency-key"), "nsfw-same-reservation");
        bodies.push(String(init?.body));
        assert.equal(JSON.parse(String(init?.body)).input.threshold, 0.5);
        return Response.json(task());
      },
    });
  }
  assert.equal(bodies[0], bodies[1]);
});

test("flagged results and every adult or special-care label block the image", async () => {
  const input = await image();
  for (const output of [result(true), ...["nudity", "sexual_activity", "sexual_suggestive"].map(label => result(false, [label])), result(false, [], ["sexual_minors"])]) {
    await assert.rejects(assertImageAllowed(input, "blocked", { transport: async () => Response.json(task({ result: output })) }), { status: 422, code: "CONTENT_BLOCKED" });
  }
});

test("malformed success payloads cannot pass moderation", async () => {
  const input = await image();
  for (const output of [
    null, {}, { type: "text", data: {} }, { type: "json", data: null },
    { type: "json", data: { flagged: false } },
    { type: "json", data: { flagged: "false", categories: { nsfw: [], special_care: [] } } },
    { type: "json", data: { flagged: false, categories: { nsfw: [], special_care: null } } },
    { type: "json", data: { flagged: false, categories: { nsfw: ["unknown"], special_care: [] } } },
  ]) {
    await assert.rejects(assertImageAllowed(input, "invalid", { transport: async () => Response.json(task({ result: output })) }), { status: 503, code: "MODERATION_UNAVAILABLE" });
  }
});

test("failed tasks, wrong bindings and unsafe task IDs fail closed", async () => {
  const input = await image();
  for (const overrides of [
    ...["failed", "canceled", "refunded", "expired", "unknown"].map(status => ({ status })),
    { model: "other-model" }, { endpoint: "other-endpoint" }, { provider: "other-provider" },
    { error: { code: "ERROR", message: "private provider payload" } },
    { id: "../other" }, { id: "https://evil.example" }, { id: "" },
  ]) {
    await assert.rejects(assertImageAllowed(input, "invalid", { transport: async () => Response.json(task(overrides)) }), { status: 503, code: "MODERATION_UNAVAILABLE" });
  }
  let count = 0;
  await assert.rejects(assertImageAllowed(input, "rebound", {
    wait: async () => {},
    transport: async () => Response.json(++count === 1 ? task({ status: "processing", result: null }) : task({ id: "task_other" })),
  }), { code: "MODERATION_UNAVAILABLE" });
});

test("HTTP failures, invalid JSON and network timeouts expose no provider payload", async () => {
  const input = await image();
  const transports: (typeof fetch)[] = [
    ...[400, 401, 402, 403, 409, 422, 429, 503].map(status => async () => Response.json({ message: "fixture-secret private image data" }, { status })),
    async () => new Response("not JSON"),
    async () => { throw new DOMException("fixture-secret", "TimeoutError"); },
  ];
  for (const transport of transports) {
    await assert.rejects(assertImageAllowed(input, "unavailable", { transport }), (error: unknown) => {
      assert.equal((error as { code: string }).code, "MODERATION_UNAVAILABLE");
      assert.doesNotMatch((error as Error).message, /fixture-secret|private image/);
      return true;
    });
  }
  await assert.rejects(assertImageAllowed(input, "poll-failure", {
    wait: async () => {},
    transport: async (_url, init) => init?.method === "POST" ? Response.json(task({ status: "processing", result: null }), { status: 202 }) : new Response(null, { status: 503 }),
  }), { code: "MODERATION_UNAVAILABLE" });
});

test("pending results never pass, and cancellation stops polling", async () => {
  const controller = new AbortController();
  let requests = 0;
  await assert.rejects(assertImageAllowed(await image(), "cancel", {
    signal: controller.signal,
    transport: async () => { requests++; return Response.json(task({ status: "processing", result: result() }), { status: 202 }); },
    wait: async (_milliseconds, signal) => { controller.abort(); assert.equal(signal.aborted, true); },
  }), { code: "MODERATION_UNAVAILABLE" });
  assert.equal(requests, 1);
  await assert.rejects(assertImageAllowed(await image(), "already-aborted", {
    signal: controller.signal, transport: async () => { assert.fail("Cancelled requests must not reach SeeAPI"); },
  }), { code: "MODERATION_UNAVAILABLE" });
});

test("Retry-After HTTP dates and missing-header backoff determine polling delay", async () => {
  const waits: number[] = [];
  let count = 0;
  await assertImageAllowed(await image(), "backoff", {
    wait: async milliseconds => { waits.push(milliseconds); },
    transport: async () => {
      count++;
      if (count === 1) return Response.json(task({ status: "processing", result: null }), { status: 202, headers: { "Retry-After": new Date(Date.now() + 10_000).toUTCString() } });
      return Response.json(task(count < 4 ? { status: "processing", result: null } : {}));
    },
  });
  assert.ok(waits[0] > 8000 && waits[0] <= 10_000);
  assert.deepEqual(waits.slice(1), [4000, 5000]);
});

test("missing credentials and invalid thresholds disable generation without provider calls", async () => {
  const input = await image();
  assert.equal(moderationReady(), true);
  for (const threshold of ["", " ", "NaN", "Infinity", "0", "1", "-0.1"]) {
    process.env.SEEAPI_NSFW_THRESHOLD = threshold;
    assert.equal(moderationReady(), false);
    await assert.rejects(assertImageAllowed(input, "config", { transport: async () => { assert.fail("Invalid config must not send an image"); } }), { code: "MODERATION_UNAVAILABLE" });
  }
  delete process.env.SEEAPI_NSFW_THRESHOLD;
  delete process.env.SEEAPI_API_KEY;
  assert.equal(moderationReady(), false);
  await assert.rejects(assertImageAllowed(input, "config"), { status: 503, code: "MODERATION_UNAVAILABLE" });
});
