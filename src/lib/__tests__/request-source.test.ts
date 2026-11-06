import test from "node:test";
import assert from "node:assert/strict";
import { requestSource } from "../request-source";
import { guestIdentity } from "../guest";
import { NextRequest } from "next/server";
import { createHmac, randomUUID } from "node:crypto";

test("trusted network identity canonicalizes equivalent addresses and rejects ambiguous input", () => {
  const keys = ["AUTH_SECRET", "TRUSTED_CLIENT_IP_HEADER"] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.AUTH_SECRET = "network-identity-test-secret-private-fixture";
  process.env.TRUSTED_CLIENT_IP_HEADER = "x-test-client-ip";
  const source = (address: string) => requestSource(new Request("https://quota.example", { headers: { "x-test-client-ip": address } }));
  try {
    assert.match(source("192.0.2.1"), /^[0-9a-f]{64}$/);
    assert.equal(source("192.0.2.1"), source("::ffff:192.0.2.1"));
    assert.equal(source("192.0.2.1"), source("0:0:0:0:0:FFFF:C000:0201"));
    assert.equal(source("2001:db8:1:2::1"), source("2001:0DB8:0001:0002:ffff:ffff:ffff:ffff"));
    assert.notEqual(source("2001:db8:1:2::1"), source("2001:db8:1:3::1"));
    assert.notEqual(source("192.0.2.1"), source("192.0.2.2"));
    for (const address of ["unknown", "192.0.2.1, 192.0.2.2", "192.0.2.1:443", "[::1]", "fe80::1%eth0", "192.000.002.001", "0xC0000201", "1".repeat(129)]) {
      assert.throws(() => source(address), { status: 400, code: "INVALID_CLIENT_ADDRESS" });
    }
    assert.throws(() => requestSource(new Request("https://quota.example", { headers: { "x-forwarded-for": "192.0.2.1" } })), { status: 503 });
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    assert.throws(() => source("192.0.2.1"), { status: 503 });
    process.env.TRUSTED_CLIENT_IP_HEADER = "invalid header";
    assert.throws(() => source("192.0.2.1"), { status: 503 });
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("concurrent, discarded and altered cookies retain one source trial identity", () => {
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "guest-cookie-test-secret-private-fixture";
  try {
    const request = (cookie?: string) => new NextRequest("https://quota.example", { headers: cookie ? { cookie: `dti-guest=${cookie}` } : {} });
    const source = "a".repeat(64), otherSource = "b".repeat(64);
    const original = guestIdentity(request(), source);
    assert.deepEqual(guestIdentity(request(original.token), source), original);
    assert.deepEqual(guestIdentity(request(), source), original);
    assert.notEqual(guestIdentity(request(), otherSource).guestId, original.guestId);
    assert.deepEqual(guestIdentity(request(original.token), otherSource), original);
    const tampered = original.token.slice(0, -1) + (original.token.endsWith("0") ? "1" : "0");
    assert.deepEqual(guestIdentity(request(tampered), source), original);
    const legacyId = randomUUID();
    const legacyToken = `${legacyId}.${createHmac("sha256", process.env.AUTH_SECRET).update(`guest:${legacyId}`).digest("hex")}`;
    assert.equal(guestIdentity(request(legacyToken), source).guestId, legacyId);
    assert.throws(() => guestIdentity(request()), { status: 503 });
  } finally {
    if (previous === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previous;
  }
});
