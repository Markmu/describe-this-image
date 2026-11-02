import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { hasAuthConfiguration } from "@/auth.configuration";

export async function GET(request: NextRequest) {
  if (!hasAuthConfiguration()) {
    const path = request.nextUrl.pathname;
    if (path.endsWith("/session")) return Response.json(null, { headers: { "Cache-Control": "no-store" } });
    if (path.endsWith("/providers")) return Response.json({}, { headers: { "Cache-Control": "no-store" } });
    return Response.redirect(new URL("/billing/login?error=Configuration", request.url));
  }
  return handlers.GET(request);
}
export async function POST(request: NextRequest) {
  if (!hasAuthConfiguration()) return Response.json({ error: "Google login is not configured. Please contact the site owner." }, { status: 503 });
  return handlers.POST(request);
}
