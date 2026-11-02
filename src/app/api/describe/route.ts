import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { HttpError, readLimitedJson, requireSameOrigin } from "@/lib/http";
import { LANGUAGES, MAX_IMAGE_BYTES } from "@/lib/image-input";
import { describeImage, normalizeImage, visionReady } from "@/lib/vision";
import { GUEST_COOKIE, guestIdentity } from "@/lib/guest";
import { rateLimit } from "@/lib/request-limit";
import { completeUsage, refundUsage, reserveUsage } from "@/lib/billing/usage";
import { BillingError } from "@/lib/billing/errors";

export async function POST(request: NextRequest) {
  let reservation: string | undefined;
  let guestToken: string | undefined;
  let response: NextResponse;
  try {
    requireSameOrigin(request);
    if (!visionReady()) throw new HttpError(503, "Image generation is unavailable. You can explore the sample previews.");
    const session = await auth();
    const userId = session?.user?.id;
    const guest = userId ? undefined : guestIdentity(request);
    guestToken = guest?.token;
    await rateLimit(request, userId);
    const body = await readLimitedJson(request, Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4096);
    if (typeof body.language !== "string" || !LANGUAGES.includes(body.language) || typeof body.requestId !== "string" || typeof body.batch !== "boolean") throw new HttpError(400, "Choose a supported language and submit a valid request.");
    if (body.batch && !userId) throw new HttpError(401, "Sign in with Google to use batch processing.");
    const image = await normalizeImage(body.image);
    const usage = await reserveUsage({ userId, guestId: guest?.guestId, requestId: body.requestId, batch: body.batch });
    reservation = usage.reservationId;
    const outputs = await describeImage(image, body.language);
    await completeUsage(reservation);
    reservation = undefined;
    response = NextResponse.json({ outputs, language: body.language, remaining: usage.remaining });
  } catch (error) {
    if (reservation) {
      try { await refundUsage(reservation); }
      catch { console.error("USAGE_REFUND_PENDING", reservation); }
    }
    const known = error instanceof HttpError || error instanceof BillingError;
    response = NextResponse.json({ error: known ? error.message : "Image generation failed. Please try again.", code: error instanceof BillingError ? error.code : undefined }, { status: known ? error.status : 503 });
  }
  response.headers.set("Cache-Control", "no-store");
  if (guestToken) response.cookies.set(GUEST_COOKIE, guestToken, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
  return response;
}
