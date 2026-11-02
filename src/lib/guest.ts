import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { HttpError } from "./http";
export const GUEST_COOKIE = "dti-guest";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32 || value.includes("replace-in-production")) throw new HttpError(503, "Guest sessions are unavailable.");
  return value;
}
function signature(id: string) { return createHmac("sha256", secret()).update(`guest:${id}`).digest("hex"); }
export function guestIdentity(request: NextRequest) {
  const [id, signed] = (request.cookies.get(GUEST_COOKIE)?.value || "").split(".");
  if (/^[a-f0-9-]{36}$/.test(id) && /^[a-f0-9]{64}$/.test(signed || "") && timingSafeEqual(Buffer.from(signature(id), "hex"), Buffer.from(signed, "hex"))) return { guestId: id, token: `${id}.${signed}` };
  const guestId = randomUUID();
  return { guestId, token: `${guestId}.${signature(guestId)}` };
}
