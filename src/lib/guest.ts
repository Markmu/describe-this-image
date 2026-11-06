import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { identitySecret } from "./request-source";
import { HttpError } from "./http";
export const GUEST_COOKIE = "dti-guest";
function signature(id: string) { return createHmac("sha256", identitySecret()).update(`guest:${id}`).digest("hex"); }
export function guestIdentity(request: NextRequest, guestSource?: string) {
  if (!/^[0-9a-f]{64}$/.test(guestSource ?? "")) throw new HttpError(503, "Guest sessions are unavailable.", "CLIENT_IDENTITY_UNAVAILABLE");
  const [id, signed] = (request.cookies.get(GUEST_COOKIE)?.value || "").split(".");
  if (/^[a-f0-9-]{36}$/.test(id) && /^[a-f0-9]{64}$/.test(signed || "") && timingSafeEqual(Buffer.from(signature(id), "hex"), Buffer.from(signed, "hex"))) return { guestId: id, token: `${id}.${signed}` };
  // Concurrent first visits and discarded cookies must resolve to the same trial identity.
  const bytes = createHmac("sha256", identitySecret()).update(`guest-bootstrap:${guestSource}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  const guestId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return { guestId, token: `${guestId}.${signature(guestId)}` };
}
