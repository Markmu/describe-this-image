import { timingSafeEqual } from "node:crypto";
import { recoverStaleUsage, pruneOperationalMetadata } from "@/lib/admin/recovery";

export const maxDuration = 90;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!secret || secret.length < 32) return Response.json({ error: "Scheduler authentication is not configured." }, { status: 503, headers });
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return Response.json({ error: "Scheduler authentication is required." }, { status: 401, headers });
  }
  try {
    const recovery = await recoverStaleUsage();
    const pruned = await pruneOperationalMetadata();
    return Response.json({ recovery, pruned }, { headers });
  } catch { return Response.json({ error: "Operational task failed. Review task records." }, { status: 503, headers }); }
}
