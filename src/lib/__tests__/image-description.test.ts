import test from "node:test";
import assert from "node:assert/strict";
import { generateImageDescription, generationReady } from "../image-description";
import { HttpError } from "../http";
import { BillingError } from "../billing/errors";

const input = { userId: "fixture-user", requestId: "fixture-request", batch: false, image: { mimeType: "image/png", data: "private-image" }, language: "French" };
const outputs = { detailed: "scene", short: "caption", alt: "alt", social: "social" };
const reservationId = "00000000-0000-4000-8000-000000000001";
type Services = NonNullable<Parameters<typeof generateImageDescription>[1]>;

function harness(overrides: Partial<Services> = {}) {
  const calls: string[] = [];
  const dependencies: Services = {
    reserveUsage: async identity => {
      calls.push("reserve");
      assert.equal(identity.requestId, input.requestId);
      assert.equal("image" in identity, false);
      return { reservationId, remaining: 10 };
    },
    assertImageAllowed: async (image, requestId) => {
      calls.push("moderate");
      assert.deepEqual(image, input.image);
      assert.equal(requestId, reservationId);
    },
    describeImage: async (image, language) => {
      calls.push("describe");
      assert.deepEqual(image, input.image);
      assert.equal(language, "French");
      return outputs;
    },
    completeUsage: async id => { calls.push("complete"); assert.equal(id, reservationId); },
    refundUsage: async id => { calls.push("refund"); assert.equal(id, reservationId); },
    ...overrides,
  };
  return { calls, dependencies };
}

test("guest, signed-in and batch requests reserve credits before moderation and charge after description", async () => {
  for (const identity of [{ userId: "fixture-user", batch: false }, { userId: undefined, guestId: "fixture-guest", guestSource: "a".repeat(64), batch: false }, { userId: "fixture-user", batch: true }]) {
    const { calls, dependencies } = harness();
    const result = await generateImageDescription({ ...input, ...identity }, dependencies);
    assert.deepEqual(result, { outputs, language: "French", remaining: 10 });
    assert.deepEqual(calls, ["reserve", "moderate", "describe", "complete"]);
  }
});

test("the generation service carries the server guest source into the quota boundary", async () => {
  const guestSource = "b".repeat(64);
  const { dependencies } = harness({ reserveUsage: async identity => {
    assert.equal(identity.guestSource, guestSource);
    assert.equal(identity.guestId, "fixture-guest");
    return { reservationId, remaining: 0 };
  } });
  await generateImageDescription({ ...input, userId: undefined, guestId: "fixture-guest", guestSource }, dependencies);
});

test("blocked, unavailable and timed-out moderation refunds credits and never calls Gemini", async () => {
  for (const error of [new HttpError(422, "blocked", "CONTENT_BLOCKED"), new HttpError(503, "unavailable", "MODERATION_UNAVAILABLE"), new DOMException("deadline", "TimeoutError")]) {
    const { calls, dependencies } = harness({ assertImageAllowed: async () => { calls.push("moderate"); throw error; } });
    await assert.rejects(generateImageDescription(input, dependencies), error);
    assert.deepEqual(calls, ["reserve", "moderate", "refund"]);
  }
});

test("insufficient credits prevent paid safety requests and model calls", async () => {
  const error = new BillingError("QUOTA_EXCEEDED", "insufficient", 429);
  const { calls, dependencies } = harness({ reserveUsage: async () => { calls.push("reserve"); throw error; } });
  await assert.rejects(generateImageDescription(input, dependencies), error);
  assert.deepEqual(calls, ["reserve"]);
});

test("description or settlement failures refund the reservation", async () => {
  const error = new HttpError(502, "description failed");
  for (const stage of ["describeImage", "completeUsage"] as const) {
    const { calls, dependencies } = harness({ [stage]: async () => { calls.push("failure"); throw error; } });
    await assert.rejects(generateImageDescription(input, dependencies), error);
    assert.equal(calls.at(-1), "refund");
    assert.equal(calls.filter(call => call === "refund").length, 1);
  }
});

test("refund failures retain the original content rejection and log only the reservation ID", async t => {
  const error = new HttpError(422, "blocked", "CONTENT_BLOCKED");
  const log = t.mock.method(console, "error", () => {});
  const { dependencies } = harness({
    assertImageAllowed: async () => { throw error; },
    refundUsage: async () => { throw new Error("database failure"); },
  });
  await assert.rejects(generateImageDescription(input, dependencies), error);
  assert.deepEqual(log.mock.calls.map(call => call.arguments), [["USAGE_REFUND_PENDING", reservationId]]);
});

test("request cancellation signal reaches moderation", async () => {
  const controller = new AbortController();
  const { dependencies } = harness({ assertImageAllowed: async (_image, _id, options) => { assert.equal(options?.signal, controller.signal); } });
  await generateImageDescription({ ...input, signal: controller.signal }, dependencies);
});

test("availability requires both Gemini and SeeAPI configuration", () => {
  const keys = ["VISION_API_KEY", "VISION_MODEL", "SEEAPI_API_KEY", "SEEAPI_NSFW_THRESHOLD"] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.VISION_API_KEY = "fixture";
    process.env.VISION_MODEL = "test-model";
    process.env.SEEAPI_API_KEY = "fixture";
    delete process.env.SEEAPI_NSFW_THRESHOLD;
    assert.equal(generationReady(), true);
    delete process.env.SEEAPI_API_KEY;
    assert.equal(generationReady(), false);
    process.env.SEEAPI_API_KEY = "fixture";
    delete process.env.VISION_API_KEY;
    assert.equal(generationReady(), false);
    process.env.VISION_API_KEY = "fixture";
    process.env.SEEAPI_NSFW_THRESHOLD = "NaN";
    assert.equal(generationReady(), false);
  } finally {
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
