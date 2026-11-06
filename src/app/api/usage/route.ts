import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { guestIdentity, GUEST_COOKIE } from "@/lib/guest";
import { getUsageStatus } from "@/lib/billing/usage";
import { generationReady } from "@/lib/image-description";
import { rateLimit } from "@/lib/request-limit";
import { HttpError, requireSameOrigin } from "@/lib/http";
export async function GET(request: NextRequest) {
  try {
    if (request.headers.has("origin")) requireSameOrigin(request);
    else if (!["same-origin", "none"].includes(request.headers.get("sec-fetch-site") ?? "")) {
      throw new HttpError(403, "Read usage from the website.");
    }
    const session = await auth();
    const guestSource = await rateLimit(request,session?.user?.id,"usage");
    const guest = session?.user?.id ? undefined : guestIdentity(request, guestSource);
    const status = await getUsageStatus({ userId: session?.user?.id, guestId: guest?.guestId, guestSource });
    const response = NextResponse.json({ ...status, generationAvailable: generationReady() }, { headers: { "Cache-Control": "no-store" } });
    if (guest) response.cookies.set(GUEST_COOKIE, guest.token, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
    return response;
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({error:error.message,generationAvailable:false},{status:error.status,headers:{"Cache-Control":"no-store"}});
    return NextResponse.json({ error: "Usage information is unavailable.", generationAvailable: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
