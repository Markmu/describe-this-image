import { processCreemEvent } from "@/lib/billing/events";
import { billingErrorResponse } from "@/lib/billing/errors";
import { HttpError, readLimitedText } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const raw = await readLimitedText(request,256 * 1024);
    return Response.json(await processCreemEvent(raw,request.headers.get("creem-signature")));
  } catch (error) {
    if (error instanceof HttpError) return Response.json({error:error.message},{status:error.status});
    return billingErrorResponse(error);
  }
}
