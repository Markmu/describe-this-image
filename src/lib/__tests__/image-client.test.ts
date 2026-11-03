import test from "node:test";
import assert from "node:assert/strict";
import { generateDescription, ImageRequestError } from "../image-client";

test("client preserves the content rejection code for single and batch flows", async t => {
  t.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ error: "Choose another image.", code: "CONTENT_BLOCKED" }, { status: 422 });
  });
  await assert.rejects(generateDescription("data:image/png;base64,fixture", "English"), (error: unknown) => {
    assert.ok(error instanceof ImageRequestError);
    assert.equal(error.code, "CONTENT_BLOCKED");
    assert.equal(error.message, "Choose another image.");
    return true;
  });
});
