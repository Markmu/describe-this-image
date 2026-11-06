import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { getBillingPool, transaction } from "../db";
import { completeUsage, getUsageStatus, grantCredits, refundUsage, reserveUsage } from "../usage";
import { rateLimit } from "../../request-limit";
import { requestSource } from "../../request-source";

const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!/^describe_audit(?:_\w+)?$/.test(new URL(database).pathname.slice(1))) throw new Error("Use an isolated describe_audit database for abuse tests.");
  process.env.DATABASE_URL = database;
}
after(async () => { if (database) await getBillingPool().end(); });

const source = () => createHash("sha256").update(randomUUID()).digest("hex");

test("guest anti-abuse boundaries against PostgreSQL", { skip: !database }, async t => {
  const pool = getBillingPool();

  await t.test("parallel fresh guest identities cannot multiply one source allowance", async () => {
    const guestSource = source();
    const identities = Array.from({ length: 6 }, () => ({ guestId: randomUUID(), guestSource }));
    const statuses = await Promise.all(identities.map(identity => getUsageStatus(identity)));
    assert.equal(statuses.reduce((sum, status) => sum + status.remaining, 0), 10);
    const winner = identities[statuses.findIndex(status => status.remaining === 10)];
    const reservation = await reserveUsage({ ...winner, requestId: randomUUID(), batch: false });
    await completeUsage(reservation.reservationId);
    assert.equal((await getUsageStatus({ guestId: randomUUID(), guestSource })).remaining, 0);
    assert.equal((await getUsageStatus(winner)).remaining, 0);
    const { rows: [counts] } = await pool.query(`SELECT
      (SELECT count(*)::int FROM guest_allowance_claims WHERE source_key=$1) AS claims,
      (SELECT count(*)::int FROM credit_grants WHERE owner_id=ANY($2)) AS grants,
      (SELECT count(*)::int FROM credit_ledger WHERE kind='grant' AND grant_id=ANY($3)) AS ledger`,
    [guestSource, identities.map(identity => `guest:${identity.guestId}`), identities.map(identity => `guest:guest:${identity.guestId}`)]);
    assert.deepEqual(counts, { claims: 1, grants: 1, ledger: 1 });
  });

  await t.test("refunds, source changes and failed transactions preserve claim boundaries", async () => {
    const firstSource = source(), secondSource = source();
    const identity = { guestId: randomUUID(), guestSource: firstSource };
    const reservation = await reserveUsage({ ...identity, requestId: randomUUID(), batch: false });
    await refundUsage(reservation.reservationId);
    await refundUsage(reservation.reservationId);
    assert.equal((await getUsageStatus(identity)).remaining, 10);
    assert.equal((await getUsageStatus({ guestId: randomUUID(), guestSource: firstSource })).remaining, 0);
    assert.equal((await getUsageStatus({ ...identity, guestSource: secondSource })).remaining, 10);
    assert.equal((await getUsageStatus({ guestId: randomUUID(), guestSource: secondSource })).remaining, 10);
    const rolledBackSource = source();
    await assert.rejects(reserveUsage({ guestId: randomUUID(), guestSource: rolledBackSource, requestId: randomUUID(), batch: true }), { code: "PRO_REQUIRED" });
    assert.equal((await getUsageStatus({ guestId: randomUUID(), guestSource: rolledBackSource })).remaining, 10);
    await assert.rejects(getUsageStatus({ guestId: identity.guestId }), { code: "INVALID_IDENTITY" });
  });

  await t.test("legacy balances remain spendable but ungranted legacy identities must claim a source", async () => {
    const guestSource = source();
    const first = { guestId: randomUUID(), guestSource };
    assert.equal((await getUsageStatus(first)).remaining, 10);
    const legacy = { guestId: randomUUID(), guestSource };
    await transaction(async db => {
      const { rows: [clock] } = await db.query("SELECT now() AS now");
      await grantCredits(db, { id: `guest:guest:${legacy.guestId}`, ownerId: `guest:${legacy.guestId}`, kind: "guest", amount: 10, startsAt: clock.now });
    });
    assert.equal((await getUsageStatus(legacy)).remaining, 10);
    const spent = await reserveUsage({ ...legacy, requestId: randomUUID(), batch: false });
    await completeUsage(spent.reservationId);
    assert.equal((await getUsageStatus(legacy)).remaining, 0);
    assert.equal((await getUsageStatus({ guestId: randomUUID(), guestSource })).remaining, 0);
  });

  await t.test("missing trusted source is rejected before touching a shared throttle bucket", async () => {
    const previous = process.env.TRUSTED_CLIENT_IP_HEADER;
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    try {
      await assert.rejects(rateLimit(new Request("https://quota.example/api/usage"), undefined, "usage"), { status: 503, code: "CLIENT_IDENTITY_UNAVAILABLE" });
      await rateLimit(new Request("https://quota.example/api/account/credits"), `google:${randomUUID()}`, "usage");
    } finally {
      if (previous === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
      else process.env.TRUSTED_CLIENT_IP_HEADER = previous;
    }
  });

  await t.test("routes enforce source claims and omit traces for admission rejects", async routeTest => {
    const keys = ["AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_URL", "TRUSTED_CLIENT_IP_HEADER", "VISION_API_KEY", "VISION_MODEL", "SEEAPI_API_KEY", "SEEAPI_NSFW_THRESHOLD"] as const;
    const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    const suffix = randomUUID().replaceAll("-", "");
    const address = `2001:db8:${suffix.slice(0, 4)}:${suffix.slice(4, 8)}::1`;
    Object.assign(process.env, {
      AUTH_SECRET: "quota-test-private-secret-for-local-fixtures",
      AUTH_GOOGLE_ID: "", AUTH_URL: "https://quota.example",
      TRUSTED_CLIENT_IP_HEADER: "x-test-client-ip", VISION_API_KEY: "fixture",
      VISION_MODEL: "fixture-model", SEEAPI_API_KEY: "fixture", SEEAPI_NSFW_THRESHOLD: "0.5",
    });
    try {
      const { POST } = await import("../../../app/api/describe/route");
      const { GET } = await import("../../../app/api/usage/route");
      const headers = { origin: "https://quota.example", "x-test-client-ip": address, "content-type": "application/json" };
      const request = () => new NextRequest("https://quota.example/api/describe", { method: "POST", headers, body: "{}" });
      const usageRequest = (cookie?: string, ip = address) => new NextRequest("https://quota.example/api/usage", { headers: { ...headers, "x-test-client-ip": ip, ...(cookie ? { cookie } : {}) } });
      const rejectedHeaders: Record<string, string>[] = [{ origin: "https://evil.example", "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "cross-site" }, {}];
      for (const extra of rejectedHeaders) {
        const crossSite = await GET(new NextRequest("https://quota.example/api/usage", { headers: { "x-test-client-ip": address, ...extra } }));
        assert.equal(crossSite.status, 403);
      }
      const { rows: [unclaimed] } = await pool.query("SELECT count(*)::int AS n FROM guest_allowance_claims WHERE source_key=$1", [requestSource(usageRequest())]);
      assert.equal(unclaimed.n, 0);

      const parallel = await Promise.all(Array.from({ length: 3 }, () => GET(usageRequest())));
      assert.deepEqual(await Promise.all(parallel.map(response => response.json().then(data => data.remaining))), [10, 10, 10]);
      assert.equal(new Set(parallel.map(response => response.cookies.get("dti-guest")?.value)).size, 1);
      const first = await GET(usageRequest());
      assert.equal(first.status, 200);
      assert.equal((await first.json()).remaining, 10);
      const cookie = first.cookies.get("dti-guest");
      assert.ok(cookie);
      assert.equal((await (await GET(usageRequest(`dti-guest=${cookie.value}`))).json()).remaining, 10);
      assert.equal((await (await GET(usageRequest())).json()).remaining, 10);
      const sameOriginMetadata = await GET(new NextRequest("https://quota.example/api/usage", { headers: { "x-test-client-ip": address, "sec-fetch-site": "same-origin" } }));
      assert.equal((await sameOriginMetadata.json()).remaining, 10);
      const reservation = await reserveUsage({ guestId: cookie.value.split(".")[0], guestSource: requestSource(usageRequest()), requestId: randomUUID(), batch: false });
      await completeUsage(reservation.reservationId);
      assert.equal((await (await GET(usageRequest())).json()).remaining, 0);
      assert.equal((await (await GET(usageRequest("dti-guest=forged"))).json()).remaining, 0);
      assert.equal((await (await GET(usageRequest(undefined, address.replace("::1", "::abcd")))).json()).remaining, 0);

      const unadmitted = await POST(new NextRequest("https://quota.example/api/describe", { method: "POST", headers: { origin: headers.origin }, body: "{}" }));
      assert.equal(unadmitted.status, 503);
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM generation_requests WHERE id=$1", [unadmitted.headers.get("x-request-id")])).rows[0].n, 0);
      assert.equal((await GET(new NextRequest("https://quota.example/api/usage", { headers: { origin: headers.origin } }))).status, 503);

      const admitted = await POST(request());
      assert.equal(admitted.status, 400);
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM generation_requests WHERE id=$1", [admitted.headers.get("x-request-id")])).rows[0].n, 1);
      const image = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#446688" } }).png().toBuffer();
      const provider = routeTest.mock.method(globalThis, "fetch", async () => { throw new Error("Quota rejection must precede provider requests"); });
      const forged = await POST(new NextRequest("https://quota.example/api/describe", {
        method: "POST", headers,
        body: JSON.stringify({ image: `data:image/png;base64,${image.toString("base64")}`, language: "English", batch: false, requestId: randomUUID(), guestSource: source(), userId: "google:forged" }),
      }));
      assert.equal(forged.status, 429);
      assert.equal((await forged.json()).code, "QUOTA_EXCEEDED");
      assert.equal(provider.mock.calls.length, 0);
      for (let n = 0; n < 28; n++) await rateLimit(request());
      for (let n = 0; n < 3; n++) {
        const response = await POST(request());
        assert.equal(response.status, 429);
        const id = response.headers.get("x-request-id");
        assert.ok(id);
        const { rows: [count] } = await pool.query("SELECT count(*)::int AS n FROM generation_requests WHERE id=$1", [id]);
        assert.equal(count.n, 0);
      }
      const otherAddress = `2001:db8:${suffix.slice(8, 12)}:${suffix.slice(12, 16)}::1`;
      const otherResponse = await POST(new NextRequest("https://quota.example/api/describe", {
        method: "POST", headers: { ...headers, "x-test-client-ip": otherAddress }, body: "{}",
      }));
      assert.equal(otherResponse.status, 400);
    } finally {
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  });
});
