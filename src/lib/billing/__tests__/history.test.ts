import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getBillingPool } from "../db";
import { completeUsage, refundUsage, reserveUsage } from "../usage";
import { getDescriptionHistory } from "../../account/queries";
import { pruneOperationalMetadata } from "../../admin/recovery";
import { generationTrace } from "../../admin/tracking";

const database = process.env.TEST_DATABASE_URL;
if (database) {
  if (!/^describe_audit(?:_\w+)?$/.test(new URL(database).pathname.slice(1))) throw new Error("Use an isolated describe_audit database for history tests.");
  process.env.DATABASE_URL = database;
}
after(async () => { if (database) await getBillingPool().end(); });

test("description history retention and ownership against PostgreSQL", { skip: !database }, async t => {
  const pool = getBillingPool();
  const users: string[] = [];
  const outputs = { detailed: "A sailboat crossing a lake.", short: "Sailboat on a lake", alt: "White sailboat on blue water", social: "A day on the water." };
  function user() { const id = `history-test:${randomUUID()}`; users.push(id); return id; }
  async function subscribe(userId: string, status = "active", days = 10) {
    const order = randomUUID();
    const id = `sub_${randomUUID()}`;
    await pool.query(`INSERT INTO billing_orders(id,user_id,offer_id,product_id,environment,amount_cents,credit_amount,status)
      VALUES($1,$2,'pro-month','prod_history','test',990,2000,'confirmed')`, [order,userId]);
    await pool.query(`INSERT INTO billing_subscriptions(id,user_id,order_id,product_id,customer_id,status,paid_through)
      VALUES($1,$2,$3,'prod_history','cus_history',$4,now()+$5*interval '1 day')`, [id,userId,order,status,days]);
    return id;
  }
  async function describe(userId: string, batch = false) {
    const usage = await reserveUsage({ userId, requestId: randomUUID(), batch });
    await completeUsage(usage.reservationId, { language: "English", outputs });
    return usage.reservationId;
  }

  try {
    await t.test("non-subscribers save four formats for 30 days and expired entries disappear before cleanup", async () => {
      const owner = user();
      const id = await describe(owner);
      const [entry] = (await getDescriptionHistory(owner)).items;
      assert.deepEqual(entry.outputs, outputs); assert.equal(entry.language, "English");
      assert.equal(entry.subscriptionActive, false); assert.equal(entry.batch, false);
      assert.equal(Date.parse(entry.expiresAt!) - Date.parse(entry.createdAt), 30*86400000);
      assert.equal((await getDescriptionHistory(user())).items.length, 0);
      await completeUsage(id, { language: "English", outputs });
      assert.equal((await getDescriptionHistory(owner)).items.length, 1);
      await pool.query("UPDATE description_history SET created_at=now()-interval '30 days' WHERE id=$1", [id]);
      assert.equal((await getDescriptionHistory(owner)).items.length, 0);
      await pruneOperationalMetadata();
      assert.equal((await pool.query("SELECT 1 FROM description_history WHERE id=$1", [id])).rowCount, 0);
      assert.equal((await pool.query("SELECT status FROM usage_reservations WHERE id=$1", [id])).rows[0].status, "completed");
    });

    await t.test("paid subscriptions retain all history until expiry, then every result follows the 30-day limit", async () => {
      for (const status of ["active", "canceled", "scheduled_cancel"]) {
        const owner = user();
        const subscription = await subscribe(owner,status);
        const old = await describe(owner,true);
        const recent = await describe(owner,true);
        await pool.query("UPDATE description_history SET created_at=now()-interval '90 days' WHERE id=$1", [old]);
        await pool.query("UPDATE description_history SET created_at=now()-interval '29 days' WHERE id=$1", [recent]);
        await pruneOperationalMetadata();
        const retained = (await getDescriptionHistory(owner)).items;
        assert.equal(retained.length,2);
        assert.ok(retained.every(entry => entry.subscriptionActive && entry.expiresAt === null && entry.batch));
        // Expiration hides old subscriber records before the scheduler has run.
        await pool.query("UPDATE billing_subscriptions SET paid_through=now() WHERE id=$1", [subscription]);
        const [entry] = (await getDescriptionHistory(owner)).items;
        assert.equal(entry.id,recent); assert.equal(entry.subscriptionActive,false);
        assert.equal(Date.parse(entry.expiresAt!) - Date.parse(entry.createdAt),30*86400000);
        assert.equal((await getDescriptionHistory(owner)).items.length,1);
        await pruneOperationalMetadata();
        assert.equal((await pool.query("SELECT 1 FROM description_history WHERE id=$1", [old])).rowCount,0);
        assert.equal((await pool.query("SELECT 1 FROM description_history WHERE id=$1", [recent])).rowCount,1);
      }
    });

    await t.test("new and overlapping subscriptions protect existing history through the last paid period", async () => {
      const owner = user();
      const old = await describe(owner);
      await subscribe(owner);
      await pool.query("UPDATE description_history SET created_at=now()-interval '90 days' WHERE id=$1", [old]);
      const second = await subscribe(owner,"scheduled_cancel",20);
      await pool.query("UPDATE billing_subscriptions SET paid_through=now() WHERE user_id=$1 AND id<>$2", [owner,second]);
      await pruneOperationalMetadata();
      assert.equal((await getDescriptionHistory(owner)).items[0].id,old);
      assert.equal((await getDescriptionHistory(owner)).items[0].subscriptionActive,true);
      await pool.query("UPDATE billing_subscriptions SET paid_through=now() WHERE id=$1", [second]);
      assert.equal((await getDescriptionHistory(owner)).items.length,0);
      await pruneOperationalMetadata();
      assert.equal((await pool.query("SELECT 1 FROM description_history WHERE id=$1", [old])).rowCount,0);
    });

    await t.test("expired and unpaid subscriptions receive 30-day retention", async () => {
      for (const [status,days] of [["active",-1],["unpaid",10]] as const) {
        const owner = user(); await subscribe(owner,status,days);
        await describe(owner);
        const id = await describe(owner);
        assert.equal((await getDescriptionHistory(owner)).items[0].subscriptionActive,false);
        await pool.query("UPDATE description_history SET created_at=now()-interval '31 days' WHERE id=$1", [id]);
        assert.ok((await getDescriptionHistory(owner)).items.every(entry => entry.id !== id));
        await pruneOperationalMetadata();
        assert.equal((await pool.query("SELECT 1 FROM description_history WHERE id=$1", [id])).rowCount,0);
      }
    });

    await t.test("history storage failure rolls back settlement so credits can be refunded", async () => {
      const owner = user();
      const usage = await reserveUsage({ userId: owner, requestId: randomUUID(), batch: false });
      const malformed = { ...outputs, alt: null } as unknown as typeof outputs;
      await assert.rejects(completeUsage(usage.reservationId, { language: "English", outputs: malformed }));
      assert.equal((await pool.query("SELECT status FROM usage_reservations WHERE id=$1", [usage.reservationId])).rows[0].status,"reserved");
      await refundUsage(usage.reservationId);
      assert.equal((await getDescriptionHistory(owner)).items.length,0);
    });

    await t.test("cursor pages preserve microseconds, tied timestamps and ownership", async () => {
      const owner = user();
      const other = user();
      await describe(other);
      const ids: string[] = Array.from({ length: 23 }, () => randomUUID());
      for (const id of ids) {
        await pool.query(`INSERT INTO usage_reservations(id,owner_id,request_id,units,batch,status)
          VALUES($1::uuid,$2,$1::text,1,false,'completed')`, [id,`user:${owner}`]);
        await pool.query(`INSERT INTO description_history(id,owner_id,language,batch,outputs,created_at)
          VALUES($1,$2,'English',false,$3,date_trunc('second',now())-interval '1 day'+interval '0.123456 seconds')`, [id,`user:${owner}`,JSON.stringify(outputs)]);
      }
      const first = await getDescriptionHistory(owner);
      assert.equal(first.items.length,20); assert.ok(first.nextCursor);
      assert.ok(first.items[0].createdAt.endsWith("123456Z"));
      const second = await getDescriptionHistory(owner,first.nextCursor);
      assert.equal(second.items.length,3); assert.equal(second.nextCursor,null);
      assert.equal(new Set([...first.items,...second.items].map(row => row.id)).size,23);
      assert.ok([...first.items,...second.items].every(row => ids.includes(row.id)));
      assert.equal((await getDescriptionHistory(other,first.nextCursor)).items.length,0);
      await assert.rejects(getDescriptionHistory(owner,"invalid"), { code: "INVALID_CURSOR" });
    });

    await t.test("subscriber request metadata survives cleanup while non-subscriber metadata expires", async () => {
      const pro = user(); const subscription = await subscribe(pro);
      const free = user();
      const traces = [];
      for (const owner of [pro,free]) {
        const trace = generationTrace(); await trace.start(); await trace.identify(owner); await trace.finish();
        traces.push(trace.id);
        await pool.query("UPDATE generation_requests SET created_at=now()-interval '90 days' WHERE id=$1", [trace.id]);
      }
      await pruneOperationalMetadata();
      assert.equal((await pool.query("SELECT 1 FROM generation_requests WHERE id=$1", [traces[0]])).rowCount,1);
      assert.equal((await pool.query("SELECT 1 FROM generation_requests WHERE id=$1", [traces[1]])).rowCount,0);
      await pool.query("UPDATE billing_subscriptions SET paid_through=now() WHERE id=$1", [subscription]);
      await pruneOperationalMetadata();
      assert.equal((await pool.query("SELECT 1 FROM generation_requests WHERE id=$1", [traces[0]])).rowCount,0);
    });
  } finally {
    const owners = users.map(id => `user:${id}`);
    await pool.query("DELETE FROM description_history WHERE owner_id=ANY($1)", [owners]);
    await pool.query("DELETE FROM generation_requests WHERE owner_id=ANY($1)", [owners]);
    await pool.query("DELETE FROM credit_ledger WHERE grant_id IN (SELECT id FROM credit_grants WHERE owner_id=ANY($1))", [owners]);
    await pool.query("DELETE FROM usage_allocations WHERE reservation_id IN (SELECT id FROM usage_reservations WHERE owner_id=ANY($1))", [owners]);
    await pool.query("DELETE FROM usage_reservations WHERE owner_id=ANY($1)", [owners]);
    await pool.query("DELETE FROM credit_grants WHERE owner_id=ANY($1)", [owners]);
    await pool.query("DELETE FROM billing_subscriptions WHERE user_id=ANY($1)", [users]);
    await pool.query("DELETE FROM billing_orders WHERE user_id=ANY($1)", [users]);
  }
});
