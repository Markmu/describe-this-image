import { auth } from "@/auth";
import { createOrder } from "@/lib/billing/orders";
import { BillingError, billingErrorResponse } from "@/lib/billing/errors";
import { appOrigin } from "@/lib/billing/callback";
import { readLimitedJson, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== appOrigin() || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new BillingError("INVALID_ORIGIN","Please submit checkout from this website.",403);
    }
    const session = await auth();
    if (!session?.user?.id || !session.user.email) throw new BillingError("LOGIN_REQUIRED","Please sign in with Google before purchasing.",401);
    const body = await readLimitedJson(request,2048);
    if (typeof body.offerId !== "string") throw new BillingError("INVALID_OFFER","Select an offer.",400);
    return Response.json(await createOrder(session.user.id,session.user.email,body.offerId), { headers: { "Cache-Control":"no-store" } });
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ error:error.message },{status:error.status});
    return billingErrorResponse(error);
  }
}
