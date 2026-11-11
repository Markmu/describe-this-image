import { accountHistoryResponse } from "@/lib/account/api";
import { getDescriptionHistory } from "@/lib/account/queries";

export async function GET(request: Request) {
  return accountHistoryResponse(request, getDescriptionHistory);
}
