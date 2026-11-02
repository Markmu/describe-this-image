import { auth } from "@/auth";
import { getBillingPool } from "@/lib/billing/db";
import { getPaymentGateway } from "@/lib/billing";
import { BillingError, billingErrorResponse } from "@/lib/billing/errors";
import { requireSameOrigin, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const session = await auth();
    if (!session?.user?.id) throw new BillingError("LOGIN_REQUIRED","Sign in to manage billing.",401);
    const gateway = getPaymentGateway();
    const { rows: [order] } = await getBillingPool().query(
      "SELECT customer_id FROM billing_orders WHERE user_id=$1 AND environment=$2 AND customer_id IS NOT NULL ORDER BY confirmed_at DESC NULLS LAST,created_at DESC LIMIT 1",
      [session.user.id,gateway.environment]);
    if (!order) throw new BillingError("NO_BILLING_ACCOUNT","No billing account is linked yet. Check your Creem receipt for a portal link.",404);
    return Response.json({url:await gateway.customerPortal(order.customer_id)},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    if (error instanceof HttpError) return Response.json({error:error.message},{status:error.status});
    return billingErrorResponse(error);
  }
}
