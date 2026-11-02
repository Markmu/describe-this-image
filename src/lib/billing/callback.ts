import { createHmac, timingSafeEqual } from "node:crypto";
import { BillingError } from "./errors";

function signingKey() {
  const key = process.env.AUTH_SECRET ?? "";
  if (key.length < 32 || /describe-this-image|replace|example|change.?me/i.test(key)) {
    throw new BillingError("BILLING_NOT_CONFIGURED", "Payment return verification is not configured.");
  }
  return key;
}
export function signReturnState(orderId: string, userId: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + 86400;
  const message = `${orderId}:${userId}:${expires}`;
  return `${expires}.${createHmac("sha256", signingKey()).update(message).digest("hex")}`;
}
export function verifyReturnState(orderId: string, userId: string, state: string, now = Date.now()) {
  const parts = /^(\d{10})\.([a-f0-9]{64})$/.exec(state);
  if (!parts || Number(parts[1]) < Math.floor(now / 1000) || Number(parts[1]) > Math.floor(now / 1000) + 86400) return false;
  const expected = createHmac("sha256", signingKey()).update(`${orderId}:${userId}:${parts[1]}`).digest();
  return timingSafeEqual(expected, Buffer.from(parts[2], "hex"));
}
export function appOrigin() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new BillingError("BILLING_NOT_CONFIGURED", "The application URL is not configured.");
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname)))) {
    throw new BillingError("BILLING_NOT_CONFIGURED", "The application URL is invalid.");
  }
  return url.origin;
}
