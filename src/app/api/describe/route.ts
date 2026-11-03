import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { HttpError, readLimitedJson, requireSameOrigin } from "@/lib/http";
import { LANGUAGES, MAX_IMAGE_BYTES } from "@/lib/image-input";
import { normalizeImage } from "@/lib/vision";
import { generateImageDescription, generationReady } from "@/lib/image-description";
import { GUEST_COOKIE, guestIdentity } from "@/lib/guest";
import { rateLimit } from "@/lib/request-limit";
import { BillingError } from "@/lib/billing/errors";

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  let guestToken: string | undefined;
  let response: NextResponse;
  try {
    requireSameOrigin(request);
    if (!generationReady()) throw new HttpError(503, "Image description is unavailable. You can explore the sample previews.");
    const session = await auth();
    const userId = session?.user?.id;
    const guest = userId ? undefined : guestIdentity(request);
    guestToken = guest?.token;
    await rateLimit(request, userId);
    const body = await readLimitedJson(request, Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4096);
    if (typeof body.language !== "string" || !LANGUAGES.includes(body.language) || typeof body.requestId !== "string" || typeof body.batch !== "boolean") throw new HttpError(400, "Choose a supported language and submit a valid request.");
    if (body.batch && !userId) throw new HttpError(401, "Sign in with Google to use batch processing.");
    const image = await normalizeImage(body.image);
    const result = await generateImageDescription({ image, language: body.language, userId, guestId: guest?.guestId, requestId: body.requestId, batch: body.batch, signal: request.signal });
    response = NextResponse.json(result);
  } catch (error) {
    const known = error instanceof HttpError || error instanceof BillingError;
    response = NextResponse.json({ error: known ? error.message : "Image description failed. Please try again.", code: known ? error.code : undefined }, { status: known ? error.status : 503 });
  }
  response.headers.set("Cache-Control", "no-store");
  if (guestToken) response.cookies.set(GUEST_COOKIE, guestToken, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return response;
}
