import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { adminUserIds, assertOperationalAccess, isAdminUser, recordLogin } from "../identity";
import { executeAdminAction, parseAdminAction } from "../actions";
import { parseAdminFilters, shanghaiDate } from "../filters";
import { getAdminDetail, getAdminList, getAdminOperations, getAdminOverview, getAdminQueue } from "../queries";
import { getBillingPool, transaction } from "../../billing/db";
import { getUsageStatus, reserveUsage, completeUsage, grantCredits } from "../../billing/usage";
import { getCreditSummary, getCreditActivity } from "../../account/queries";
import { generationTrace, requestOutcome } from "../tracking";
import { generateImageDescription } from "../../image-description";
import { HttpError } from "../../http";
import { recoverStaleUsage, pruneOperationalMetadata } from "../recovery";

test("administrator allowlist denies empty, email and partial matches", () => {
  assert.deepEqual(adminUserIds({ADMIN_USER_IDS:"google:123, user@example.com,google:456"}),["google:123","google:456"]);
  for(const id of [undefined,"google:12","user@example.com","google:123 "]) assert.equal(isAdminUser(id,{ADMIN_USER_IDS:"google:123"}),false);
  assert.equal(isAdminUser("google:123",{ADMIN_USER_IDS:"google:123"}),true);
  assert.equal(isAdminUser("google:123",{}),false);
});

test("admin input validates reasons, dates, credits, recovery IDs and filter cursors", () => {
  const base={operationId:randomUUID(),action:"compensate",target:"google:fixture",reason:"客服补偿",amount:10};
  assert.equal(parseAdminAction(base).amount,10);
  for(const update of [{amount:0},{amount:1.5},{amount:100001},{reason:""},{operationId:"bad"},{expiresAt:"2020-01-01"},{reference:{}},{action:"settings",pauseGeneration:"false",pauseCheckout:false},{action:"recover",target:"bad"}]) assert.throws(()=>parseAdminAction({...base,...update}));
  assert.equal(shanghaiDate("2026-11-06"),"2026-11-05T16:00:00.000Z");
  for(const date of ["2026-02-30","2026-13-01","0000-01-01","invalid"]) assert.throws(()=>shanghaiDate(date));
  for(const query of ["cursor=not-json","from=2026-11-06&to=2026-11-05","environment=other"]) assert.throws(()=>parseAdminFilters(new URLSearchParams(query)));
  const f=parseAdminFilters(new URLSearchParams("from=2026-11-06&to=2026-11-06"));
  assert.equal(f.to,"2026-11-06T16:00:00.000Z");
  assert.equal(requestOutcome(new HttpError(422,"private message","CONTENT_BLOCKED"),"moderation").result,"blocked");
  assert.equal(requestOutcome(new Error("private payload"),"generation").code,"MODEL_UNAVAILABLE");
});

const database=process.env.TEST_DATABASE_URL;
if(database) {
  if(!/^describe_audit(?:_\w+)?$/.test(new URL(database).pathname.slice(1))) throw new Error("Use an isolated describe_audit database for admin tests.");
  process.env.DATABASE_URL=database;
  process.env.CREEM_ENVIRONMENT="test";
}
after(async()=>{if(database)await getBillingPool().end();});

test("administrator workflows against PostgreSQL",{skip:!database},async t=>{
  const pool=getBillingPool();
  const actor=`google:admin-${randomUUID()}`;
  const prefix=`admin-test-${randomUUID()}`;
  const user=`google:${prefix}`;
  const previousAdmins=process.env.ADMIN_USER_IDS;
  const {rows:[previousSettings]}=await pool.query("SELECT * FROM operation_settings WHERE id=true");
  process.env.ADMIN_USER_IDS=actor;
  const action=(action:string,target:string,extra:Record<string,unknown>={})=>({operationId:randomUUID(),action,target,reason:"Integration test operation",...extra});
  try {
    await recordLogin(user,`${prefix}@example.test`,"运营测试账户");
    await t.test("user reads never mint welcome credits and detail queries bind their references",async()=>{
      const users=await getAdminList("users",new URLSearchParams({q:prefix}));
      assert.equal(users.items.length,1);
      assert.equal(Number(users.items[0].credits),0);
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM credit_grants WHERE owner_id=$1",[`user:${user}`])).rows[0].n,0);
      assert.equal((await getAdminDetail("users",user,"test")).email,`${prefix}@example.test`);
      assert.equal((await getAdminList("users",new URLSearchParams({q:"' OR 1=1 --"}))).items.length,0);
      await assert.rejects(getAdminDetail("missing",user,"test"),{status:404});
    });
    await t.test("concurrent compensation is idempotent, audited and spendable in account views",async()=>{
      const input=action("compensate",user,{amount:50,reference:"support-request"});
      const results=await Promise.all([executeAdminAction(actor,input),executeAdminAction(actor,input),executeAdminAction(actor,input)]);
      assert.equal(results.filter(row=>!row.duplicate).length,1);
      assert.equal((await pool.query("SELECT g.starts_at<=a.created_at AND a.created_at-g.starts_at<interval '1 millisecond' AS same_clock FROM credit_grants g JOIN admin_audit a ON a.id=$1 WHERE g.id=$2",[input.operationId,`compensation:${input.operationId}`])).rows[0].same_clock,true);
      assert.equal((await getCreditSummary(user)).remaining,70);
      assert.equal((await getUsageStatus({userId:user})).remaining,70);
      const history=await getCreditActivity(user);
      assert.ok(history.items.some(row=>row.label==="Support credits"&&row.delta===50));
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM credit_ledger WHERE grant_id=$1",[`compensation:${input.operationId}`])).rows[0].n,1);
      await assert.rejects(executeAdminAction(actor,{...input,amount:100}),{code:"OPERATION_CONFLICT"});
      await assert.rejects(executeAdminAction("google:ordinary",action("compensate",user,{amount:50})),{status:403});
      for(let n=0;n<3;n++){const usage=await reserveUsage({userId:user,requestId:randomUUID(),batch:false});await completeUsage(usage.reservationId);}
      assert.equal((await getUsageStatus({userId:user})).remaining,40);
      const welcome=await getAdminList("grants",new URLSearchParams({user,status:"welcome"}));
      assert.equal(welcome.items[0].remaining,0);assert.equal(welcome.items[0].spendable,false);
    });
    await t.test("suspension and pause flags block reservations and checkout while usage history stays readable",async()=>{
      await executeAdminAction(actor,action("ban",user));
      await assert.rejects(reserveUsage({userId:user,requestId:randomUUID(),batch:false}),{code:"ACCOUNT_SUSPENDED"});
      await assert.rejects(transaction(db=>assertOperationalAccess(db,user,"checkout")),{code:"ACCOUNT_SUSPENDED"});
      assert.equal((await getUsageStatus({userId:user})).remaining,40);
      await executeAdminAction(actor,action("unban",user));
      await executeAdminAction(actor,action("settings","settings",{pauseGeneration:true,pauseCheckout:true}));
      await assert.rejects(reserveUsage({guestId:randomUUID(),guestSource:randomUUID().replaceAll("-","").repeat(2),requestId:randomUUID(),batch:false}),{code:"SERVICE_PAUSED"});
      await assert.rejects(transaction(db=>assertOperationalAccess(db,user,"checkout")),{code:"SERVICE_PAUSED"});
      assert.equal((await getUsageStatus({userId:user})).remaining,40);
      await executeAdminAction(actor,action("settings","settings",{pauseGeneration:false,pauseCheckout:false}));
    });
    await t.test("stale recovery is atomic with audit and rejects live, complete and repeated reservations",async()=>{
      const live=await reserveUsage({userId:user,requestId:randomUUID(),batch:false});
      await assert.rejects(executeAdminAction(actor,action("recover",live.reservationId)),{code:"RECOVERY_NOT_ELIGIBLE"});
      await pool.query("UPDATE usage_reservations SET created_at=now()-interval '6 minutes' WHERE id=$1",[live.reservationId]);
      const input=action("recover",live.reservationId);
      await executeAdminAction(actor,input);await executeAdminAction(actor,input);
      assert.equal((await getUsageStatus({userId:user})).remaining,40);
      await assert.rejects(executeAdminAction(actor,action("recover",live.reservationId)),{code:"RECOVERY_NOT_ELIGIBLE"});
      const done=await reserveUsage({userId:user,requestId:randomUUID(),batch:false});await completeUsage(done.reservationId);
      await pool.query("UPDATE usage_reservations SET created_at=now()-interval '6 minutes' WHERE id=$1",[done.reservationId]);
      await assert.rejects(executeAdminAction(actor,action("recover",done.reservationId)),{code:"RECOVERY_NOT_ELIGIBLE"});
    });
    await t.test("trace records metadata stages and settlement without image or description payloads",async()=>{
      const trace=generationTrace();await trace.start();await trace.identify(user);await trace.input(randomUUID(),"English",false);
      await generateImageDescription({userId:user,requestId:randomUUID(),batch:false,language:"English",image:{mimeType:"image/png",data:"PRIVATE_IMAGE_BYTES"},onStage:trace.event},{reserveUsage,completeUsage,refundUsage:async()=>{},assertImageAllowed:async()=>{},describeImage:async()=>({detailed:"PRIVATE_DESCRIPTION",short:"a",alt:"b",social:"c"})});
      await trace.finish();
      const row=await getAdminDetail("requests",trace.id,"test");
      assert.equal(row.status,"succeeded");assert.equal(row.reservation_status,"completed");assert.equal(row.moderation,"passed");
      assert.ok(Number(row.duration_ms)>=0);assert.ok(Array.isArray(row.stages));
      assert.ok(!JSON.stringify(row).includes("PRIVATE_"));
    });
    await t.test("recovery preserves expired grant boundaries and cannot revive spendable credits",async()=>{
      const expiredUser=`${user}-expired`;
      await recordLogin(expiredUser);
      for(let n=0;n<2;n++){const r=await reserveUsage({userId:expiredUser,requestId:randomUUID(),batch:false});await completeUsage(r.reservationId);}
      const grantId=`expired-test:${randomUUID()}`;
      await transaction(db=>grantCredits(db,{id:grantId,ownerId:`user:${expiredUser}`,kind:"compensation",amount:10,startsAt:new Date(Date.now()-60000)}));
      const r=await reserveUsage({userId:expiredUser,requestId:randomUUID(),batch:false});
      await pool.query("UPDATE credit_grants SET starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE id=$1",[grantId]);
      await pool.query("UPDATE usage_reservations SET created_at=now()-interval '6 minutes' WHERE id=$1",[r.reservationId]);
      await executeAdminAction(actor,action("recover",r.reservationId));
      assert.equal((await getUsageStatus({userId:expiredUser})).remaining,0);
      assert.equal((await pool.query("SELECT remaining FROM credit_grants WHERE id=$1",[grantId])).rows[0].remaining,10);
    });
    await t.test("cases are validated, linked and removed from the open queue",async()=>{
      const r=await reserveUsage({userId:user,requestId:randomUUID(),batch:false});
      await pool.query("UPDATE usage_reservations SET created_at=now()-interval '6 minutes' WHERE id=$1",[r.reservationId]);
      assert.ok((await getAdminQueue()).some(row=>row.source_id===r.reservationId));
      await executeAdminAction(actor,action("case",r.reservationId,{sourceType:"reservation",status:"resolved"}));
      assert.ok(!(await getAdminQueue()).some(row=>row.source_id===r.reservationId));
      await assert.rejects(executeAdminAction(actor,action("case",randomUUID(),{sourceType:"reservation",status:"resolved"})),{status:404});
      await executeAdminAction(actor,action("recover",r.reservationId));
    });
    await t.test("cursor pagination retains tied microseconds without duplicating users",async()=>{
      const pagePrefix=`${prefix}-page`;
      for(let n=0;n<30;n++)await pool.query("INSERT INTO app_users(id,email,created_at)VALUES($1,$2,'2026-11-01T00:00:00.123456Z')",[`${pagePrefix}-${n}`,`${pagePrefix}-${n}@example.test`]);
      const first=await getAdminList("users",new URLSearchParams({q:pagePrefix}));assert.equal(first.items.length,25);assert.ok(first.nextCursor);
      const second=await getAdminList("users",new URLSearchParams({q:pagePrefix,cursor:first.nextCursor!}));assert.equal(second.items.length,5);
      assert.equal(new Set([...first.items,...second.items].map(row=>row.id)).size,30);
    });
    await t.test("all operational views and schedule snapshots execute against the migrated schema",async()=>{
      await executeAdminAction(actor,action("probe","database"));
      const recovered=await recoverStaleUsage();assert.ok(recovered.id);
      for(const resource of ["orders","payments","subscriptions","grants","ledger","reservations","requests","webhooks","tasks","audit","cases"]){assert.ok(Array.isArray((await getAdminList(resource,new URLSearchParams())).items));}
      const overview=await getAdminOverview(new URLSearchParams("days=7"));assert.equal(overview.trend.length,7);assert.ok(Number(overview.metrics.images)>=1);
      const operations=await getAdminOperations();assert.ok(operations.probes.some(row=>row.service==="database"&&row.status==="passed"));assert.equal(operations.task.status,"succeeded");
      await pruneOperationalMetadata();
    });
  } finally {
    if(previousAdmins===undefined)delete process.env.ADMIN_USER_IDS;else process.env.ADMIN_USER_IDS=previousAdmins;
    await pool.query("UPDATE operation_settings SET pause_generation=$1,pause_checkout=$2 WHERE id=true",[previousSettings.pause_generation,previousSettings.pause_checkout]);
  }
});
