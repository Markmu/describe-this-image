import { hasAuthConfiguration } from "@/auth.configuration";
import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json({ configured: hasAuthConfiguration() }, { headers: { "Cache-Control": "no-store" } });
}
