import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { HttpError } from "./http";

export function identitySecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32 || value.includes("replace-in-production")) {
    throw new HttpError(503, "Guest sessions are unavailable.", "CLIENT_IDENTITY_UNAVAILABLE");
  }
  return value;
}

function networkAddress(address: string) {
  if (address.length > 45 || address.includes("%")) return;
  const family = isIP(address);
  if (family === 4) return `v4:${address}`;
  if (family !== 6) return;

  // URL canonicalization expands dotted IPv4 tails into hexadecimal groups.
  const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
  const [head, tail] = canonical.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = (tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill("0"), ...right])
    .map(group => parseInt(group, 16));
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff) {
    return `v4:${[groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255].join(".")}`;
  }
  return `v6:${groups.slice(0, 4).map(group => group.toString(16)).join(":")}/64`;
}

export function requestSource(request: Request) {
  // The deployment must overwrite this header and block direct access to the origin.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER?.trim();
  if (!header || !/^[!#$%&'*+.^_`|~0-9a-z-]+$/i.test(header)) {
    throw new HttpError(503, "Guest access is unavailable. Sign in with Google to continue.", "CLIENT_IDENTITY_UNAVAILABLE");
  }
  const address = request.headers.get(header)?.trim();
  if (!address) throw new HttpError(503, "Guest access is unavailable. Sign in with Google to continue.", "CLIENT_IDENTITY_UNAVAILABLE");
  const network = networkAddress(address);
  if (!network) throw new HttpError(400, "The client address is invalid.", "INVALID_CLIENT_ADDRESS");
  return createHmac("sha256", identitySecret()).update(`client-source:${network}`).digest("hex");
}
