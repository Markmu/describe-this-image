import { accountHistoryResponse } from "@/lib/account/api";
import { getCreditActivity } from "@/lib/account/queries";

export async function GET(request: Request) {
  return accountHistoryResponse(request, getCreditActivity);
}
