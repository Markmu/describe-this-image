export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

export function requireSameOrigin(request: Request) {
  const expected = new URL(process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (request.headers.get("origin") !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new HttpError(403, "Please submit this request from the website.");
  }
}

export async function readLimitedText(request: Request, limit: number): Promise<string> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new HttpError(415, "Send JSON data.");
  const declared = Number(request.headers.get("content-length"));
  if (declared > limit) throw new HttpError(413, "The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "The request is empty.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new HttpError(413, "The request is too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readLimitedJson(request: Request, limit: number): Promise<Record<string, unknown>> {
  const raw = await readLimitedText(request, limit);
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch { throw new HttpError(400, "Invalid JSON request."); }
}
