import sharp from "sharp";
import { setTimeout as delay } from "node:timers/promises";
import { HttpError } from "./http";

const INFERENCES_URL = "https://api.seeapi.com/v1/inferences";
const TIMEOUT_MS = 30_000;
const NSFW_LABELS = new Set(["nudity", "sexual_activity", "sexual_suggestive"]);
const SPECIAL_CARE_LABELS = new Set(["sexual_minors"]);

type Image = { mimeType: string; data: string };
type Options = {
  transport?: typeof fetch;
  signal?: AbortSignal;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
};

function configuration() {
  const apiKey = process.env.SEEAPI_API_KEY?.trim();
  const threshold = Number(process.env.SEEAPI_NSFW_THRESHOLD ?? "0.5");
  if (!apiKey || !Number.isFinite(threshold) || threshold < 0.01 || threshold > 0.99) return;
  return { apiKey, threshold };
}

export function moderationReady() {
  return Boolean(configuration());
}

function unavailable() {
  return new HttpError(503, "Image safety checks are unavailable. Please retry.", "MODERATION_UNAVAILABLE");
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw unavailable();
  return value as Record<string, unknown>;
}

function labels(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value) || !value.every(label => typeof label === "string" && allowed.has(label))) throw unavailable();
  return value;
}

function assertAllowed(result: unknown) {
  const output = record(result);
  if (output.type !== "json") throw unavailable();
  const data = record(output.data);
  const categories = record(data.categories);
  const nsfw = labels(categories.nsfw, NSFW_LABELS);
  const specialCare = labels(categories.special_care, SPECIAL_CARE_LABELS);
  if (typeof data.flagged !== "boolean") throw unavailable();
  if (data.flagged || nsfw.length || specialCare.length) {
    throw new HttpError(422, "This image is blocked by our content safety policy. Choose another image.", "CONTENT_BLOCKED");
  }
}

function pollDelay(response: Response, attempt: number) {
  const header = response.headers.get("retry-after");
  if (header !== null) {
    const seconds = Number(header);
    const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
    if (Number.isFinite(milliseconds)) return Math.max(250, Math.min(milliseconds, TIMEOUT_MS));
  }
  return Math.min(2000 * 2 ** attempt, 5000);
}

export async function assertImageAllowed(image: Image, requestId: string, options: Options = {}): Promise<void> {
  const config = configuration();
  if (!config) throw unavailable();
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const transport = options.transport ?? fetch;
  const wait = options.wait ?? ((milliseconds, signal) => delay(milliseconds, undefined, { signal }));
  try {
    signal.throwIfAborted();
    // Letterboxing preserves the full frame and satisfies SeeAPI's minimum dimensions and pixel count.
    const png = await sharp(Buffer.from(image.data, "base64"))
      .flatten({ background: "#ffffff" })
      .resize(1536, 1536, { fit: "contain", background: "#ffffff" })
      .png().toBuffer();
    const headers = { Authorization: `Bearer ${config.apiKey}` };
    let response = await transport(INFERENCES_URL, {
      method: "POST", redirect: "error", cache: "no-store", signal,
      headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": `nsfw-${requestId}` },
      body: JSON.stringify({
        model: "nsfw-filter-2", endpoint: "image-moderation", provider: "seeapi",
        input: { image_url: `data:image/png;base64,${png.toString("base64")}`, threshold: config.threshold, strict_special_care: true },
      }),
    });
    if (response.status !== 200 && response.status !== 202) throw unavailable();
    let task = record(await response.json());
    const taskId = task.id;
    if (typeof taskId !== "string" || !/^[a-zA-Z0-9_-]{1,255}$/.test(taskId)) throw unavailable();
    let attempt = 0;
    while (true) {
      signal.throwIfAborted();
      if (task.id !== taskId || task.model !== "nsfw-filter-2" || task.endpoint !== "image-moderation" || task.provider !== "seeapi" || task.error !== null) throw unavailable();
      if (task.status === "succeeded") {
        assertAllowed(task.result);
        return;
      }
      if (task.status !== "processing") throw unavailable();
      await wait(pollDelay(response, attempt++), signal);
      signal.throwIfAborted();
      response = await transport(`${INFERENCES_URL}/${taskId}`, { method: "GET", headers, redirect: "error", cache: "no-store", signal });
      if (response.status !== 200) throw unavailable();
      task = record(await response.json());
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw unavailable();
  }
}
