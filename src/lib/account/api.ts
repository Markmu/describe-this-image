import { requireAccountApi } from "./session";
import { billingErrorResponse } from "../billing/errors";
import { rateLimit } from "../request-limit";
import { HttpError } from "../http";

export async function accountHistoryResponse(request: Request, load: (userId: string, cursor: string | null) => Promise<unknown>) {
  try {
    const userId = await requireAccountApi();
    await rateLimit(request, userId, "usage");
    const cursor = new URL(request.url).searchParams.get("cursor");
    return Response.json(await load(userId, cursor), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return billingErrorResponse(error);
  }
}
