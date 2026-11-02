export class BillingError extends Error {
  constructor(public code: string, message: string, public status = 503) {
    super(message);
    this.name = "BillingError";
  }
}

export function billingErrorResponse(error: unknown): Response {
  const known = error instanceof BillingError;
  return Response.json({
    error: known ? error.message : "Billing service is unavailable. Please try again later.",
    code: known ? error.code : "BILLING_UNAVAILABLE",
  }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
