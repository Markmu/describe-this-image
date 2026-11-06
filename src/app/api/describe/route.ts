import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { HttpError, readLimitedJson, requireSameOrigin } from "@/lib/http";
import { LANGUAGES, MAX_IMAGE_BYTES } from "@/lib/image-input";
import { normalizeImage } from "@/lib/vision";
import { generateImageDescription, generationReady } from "@/lib/image-description";
import { GUEST_COOKIE, guestIdentity } from "@/lib/guest";
import { rateLimit } from "@/lib/request-limit";
import { BillingError } from "@/lib/billing/errors";
import { generationTrace } from "@/lib/admin/tracking";

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  let guestToken: string | undefined;
  let response: NextResponse;
  const trace = generationTrace();
  let started = false;
  try {
    requireSameOrigin(request);
    const session = await auth();
    const userId = session?.user?.id;
    const guestSource = await rateLimit(request, userId);
    if (!generationReady()) throw new HttpError(503, "Image description is unavailable. You can explore the sample previews.", "GENERATION_NOT_CONFIGURED");
    const guest = userId ? undefined : guestIdentity(request, guestSource);
    guestToken = guest?.token;
    await trace.start();
    started = true;
    await trace.identify(userId, guest?.guestId);
    const body = await readLimitedJson(request, Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4096);
    if (typeof body.language !== "string" || !LANGUAGES.includes(body.language) || typeof body.requestId !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(body.requestId) || typeof body.batch !== "boolean") throw new HttpError(400, "Choose a supported language and submit a valid request.");
    if (body.batch && !userId) throw new HttpError(401, "Sign in with Google to use batch processing.");
    await trace.input(body.requestId, body.language, body.batch);
    await trace.event("validation");
    const image = await normalizeImage(body.image);
    const result = await generateImageDescription({ image, language: body.language, userId, guestId: guest?.guestId, guestSource, requestId: body.requestId, batch: body.batch, signal: request.signal, onStage: trace.event });
    await trace.finish();
    response = NextResponse.json(result);
  } catch (error) {
    const known = error instanceof HttpError || error instanceof BillingError;
    if (started) await trace.finish(error);
    response = NextResponse.json({ error: known ? error.message : "Image description failed. Please try again.", code: known ? error.code : undefined, requestId: trace.id }, { status: known ? error.status : 503 });
  }
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Request-Id", trace.id);
  if (guestToken) response.cookies.set(GUEST_COOKIE, guestToken, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return response;
}
