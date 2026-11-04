import { accountHistoryResponse } from "@/lib/account/api";
import { getAccountPayments } from "@/lib/account/queries";

export async function GET(request: Request) {
  return accountHistoryResponse(request, getAccountPayments);
}
