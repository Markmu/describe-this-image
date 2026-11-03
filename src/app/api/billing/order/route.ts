import { auth } from "@/auth";
import { getOwnedOrder } from "@/lib/billing/orders";
import { BillingError, billingErrorResponse } from "@/lib/billing/errors";
import { getOrderOffer } from "@/lib/billing";
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new BillingError("LOGIN_REQUIRED","Sign in to view this order.",401);
    const order = await getOwnedOrder(new URL(request.url).searchParams.get("id") ?? "",session.user.id);
    return Response.json({id:order.id,status:order.status,offer:getOrderOffer(order.offer_id)?.name},
      {headers:{"Cache-Control":"no-store"}});
  } catch (error) { return billingErrorResponse(error); }
}
