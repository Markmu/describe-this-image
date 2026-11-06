import { MAX_IMAGE_BYTES, publicImageUrl, validateImageFile, type ImageOutputs } from "./image-input";

export class ImageRequestError extends Error {
  constructor(message: string, public code?: string, public requestId?: string) { super(requestId ? `${message} Reference: ${requestId}` : message); }
}

export async function fileData(file: File): Promise<string> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The file could not be read. Please choose it again."));
    reader.onabort = () => reject(new Error("File reading was canceled."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function remoteImage(input: string): Promise<File> {
  const url = publicImageUrl(input);
  let response: Response;
  try {
    response = await fetch(url, { credentials: "omit", redirect: "error", mode: "cors", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(15000) });
  } catch { throw new Error("This website does not allow image imports. Download the image and upload it here."); }
  if (!response.ok || !response.body) throw new Error("This image could not be loaded. Upload the file instead.");
  const reader = response.body.getReader();
  const parts: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error("Images must be 10 MB or smaller."); }
      parts.push(new Uint8Array(value));
    }
  } finally { reader.releaseLock(); }
  const file = new File(parts, "linked-image", { type: response.headers.get("content-type")?.split(";")[0] || "" });
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  return file;
}

export async function generateDescription(image: string, language: string, batch = false, signal?: AbortSignal): Promise<{ outputs: ImageOutputs; language: string; remaining: number }> {
  const response = await fetch("/api/describe", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, language, batch, requestId: crypto.randomUUID() }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90000)]) : AbortSignal.timeout(90000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ImageRequestError(data.error || "Generation failed. Please try again.", data.code, typeof data.requestId === "string" ? data.requestId : undefined);
  if (!data.outputs || ["detailed", "short", "alt", "social"].some(key => typeof data.outputs[key] !== "string")) throw new Error("The response was incomplete. Please try again.");
  return data;
}
