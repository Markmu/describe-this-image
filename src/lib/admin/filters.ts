import { HttpError } from "../http";

export type AdminFilters = { q: string; status: string; user: string; plan: string; environment: string; from: string | null; to: string | null; cursor: { at: string; id: string } | null; days: number };

export function shanghaiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) throw new HttpError(400, "Choose a valid date.");
  const date = new Date(`${value}T00:00:00+08:00`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10) !== value) throw new HttpError(400, "Choose a valid date.");
  return date.toISOString();
}

export function parseAdminFilters(params: URLSearchParams): AdminFilters {
  const q = params.get("q")?.trim() ?? "";
  const user = params.get("user") ?? "";
  const status = params.get("status") ?? "";
  const plan = params.get("plan") ?? "";
  const environment = params.get("environment") || process.env.CREEM_ENVIRONMENT || "test";
  if (q.length > 256 || user.length > 256 || status.length > 80 || !["test", "live"].includes(environment) || !["","free","pro-month","pro-year"].includes(plan)) throw new HttpError(400, "Invalid filters.");
  const from = params.get("from") ? shanghaiDate(params.get("from")!) : null;
  const end = params.get("to") ? shanghaiDate(params.get("to")!) : null;
  const to = end ? new Date(Date.parse(end) + 86400000).toISOString() : null;
  if (from && to && from >= to) throw new HttpError(400, "Start date must precede the end date.");
  let cursor: AdminFilters["cursor"] = null;
  const encoded = params.get("cursor");
  if (encoded) {
    try {
      if (encoded.length > 1400) throw new Error();
      const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString());
      if (typeof parsed.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(parsed.at)
        || !Number.isFinite(Date.parse(parsed.at)) || new Date(parsed.at).toISOString() !== `${parsed.at.slice(0,23)}Z`
        || typeof parsed.id !== "string" || !parsed.id || parsed.id.length > 256) throw new Error();
      cursor = parsed;
    } catch { throw new HttpError(400, "Invalid page cursor.", "INVALID_CURSOR"); }
  }
  return { q, status, user, plan, environment, from, to, cursor, days: params.get("days") === "30" ? 30 : 7 };
}
