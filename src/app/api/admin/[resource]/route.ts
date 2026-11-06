import { requireAdminApi } from "@/lib/admin/access";
import { executeAdminAction } from "@/lib/admin/actions";
import { getAdminDetail, getAdminList, getAdminOperations, getAdminOverview, getAdminQueue } from "@/lib/admin/queries";
import { BillingError } from "@/lib/billing/errors";
import { HttpError, readLimitedJson, requireSameOrigin } from "@/lib/http";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const respond = (value: unknown, status = 200) => Response.json(value, { status, headers });
function failure(error: unknown) {
  const known = error instanceof HttpError || error instanceof BillingError;
  return respond({ error: known ? error.message : "Administration data is unavailable. Check database configuration and migrations.", code: known ? error.code : "ADMIN_UNAVAILABLE" }, known ? error.status : 503);
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    await requireAdminApi();
    const { resource } = await context.params;
    const params = new URL(request.url).searchParams;
    if (resource === "overview") return respond(await getAdminOverview(params));
    if (resource === "operations") return respond(await getAdminOperations());
    if (resource === "queue") return respond(await getAdminQueue());
    const id = params.get("id");
    return respond(id ? await getAdminDetail(resource, id, params.get("environment") || process.env.CREEM_ENVIRONMENT || "test") : await getAdminList(resource, params));
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    const actorId = await requireAdminApi();
    requireSameOrigin(request);
    if ((await context.params).resource !== "actions") throw new HttpError(405, "This view does not accept changes.");
    return respond(await executeAdminAction(actorId, await readLimitedJson(request, 8192)));
  } catch (error) { return failure(error); }
}
