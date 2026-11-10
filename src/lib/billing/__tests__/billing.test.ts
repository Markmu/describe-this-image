import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { CreemGateway, verifyCreemSignature, validateCheckoutUrl } from "../providers/creem";
import { getOrderOffer, PLAN_OFFERS } from "../types";
import { monthBoundary, processCreemEvent } from "../events";
import { getBillingPool, transaction } from "../db";
import { createOrder, getOwnedOrder } from "../orders";
import { getProductBinding } from "../index";
import { completeUsage, getUsageStatus, grantCredits, refundUsage, reserveUsage } from "../usage";

const secret = "test-webhook-secret";
test("webhook signatures require a secret and exact raw bytes", () => {
  const raw='{"a":1}';const signature=createHmac("sha256",secret).update(raw).digest("hex");
  assert.equal(verifyCreemSignature(raw,signature,secret),true);
  assert.equal(verifyCreemSignature(raw+" ",signature,secret),false);
  assert.equal(verifyCreemSignature(raw,signature,""),false);
  assert.equal(verifyCreemSignature(raw,null,secret),false);
  assert.throws(() => new CreemGateway("test","",secret));
  for (const url of ["https://creem.io.evil.example/a","javascript:alert(1)","https://user@creem.io/a"]) assert.throws(() => validateCheckoutUrl(url));
});
test("calendar month boundaries retain the billing anniversary", () => {
  const start=new Date("2028-01-31T10:30:00Z");
  assert.equal(monthBoundary(start,1).toISOString(),"2028-02-29T10:30:00.000Z");
  assert.equal(monthBoundary(start,2).toISOString(),"2028-03-31T10:30:00.000Z");
});
test("provider requests use documented methods, URLs and order bindings", async () => {
  const original=globalThis.fetch;const requests:{url:string;init?:RequestInit}[]=[];
  globalThis.fetch=async(url,init)=>{
    requests.push({url:String(url),init});
    if(String(url).endsWith("/v1/products/prod_starter")) return Response.json({id:"prod_starter",mode:"test",status:"active",price:699,currency:"USD",billing_type:"onetime"});
    if(init?.method==="POST" && String(url).endsWith("/v1/checkouts")) return Response.json({id:"ch_test",mode:"test",status:"pending",request_id:"order-1",product:"prod_starter",checkout_url:"https://www.creem.io/test/payment/ch_test"});
    if(String(url).endsWith("/v1/customers/billing")) return Response.json({customer_portal_link:"https://www.creem.io/my-orders/login/token"});
    return Response.json({id:new URL(String(url)).searchParams.values().next().value,mode:"test"});
  };
  try {
    const gateway=new CreemGateway("test","fixture-key",secret);
    await gateway.validateProduct("prod_starter",PLAN_OFFERS.starter);
    await gateway.createCheckout({orderId:"order-1",productId:"prod_starter",offerId:"starter",customerEmail:"user@example.com",successUrl:"https://site.example/billing/success"});
    await gateway.getCheckout("ch_test");await gateway.getSubscription("sub_test");await gateway.getTransaction("txn_test");await gateway.customerPortal("cus_test");
    assert.deepEqual(requests.map(r=>[r.init?.method,r.url]),[
      ["GET","https://test-api.creem.io/v1/products/prod_starter"],
      ["POST","https://test-api.creem.io/v1/checkouts"],
      ["GET","https://test-api.creem.io/v1/checkouts?checkout_id=ch_test"],
      ["GET","https://test-api.creem.io/v1/subscriptions?subscription_id=sub_test"],
      ["GET","https://test-api.creem.io/v1/transactions?transaction_id=txn_test"],
      ["POST","https://test-api.creem.io/v1/customers/billing"]]);
    const body=JSON.parse(String(requests[1].init?.body));
    assert.deepEqual(body.customer,{email:"user@example.com"});
    assert.deepEqual(body.metadata,{orderId:"order-1",offerId:"starter"});
    assert.equal(body.request_id,"order-1");assert.equal(body.units,1);
    assert.deepEqual(JSON.parse(String(requests[5].init?.body)),{customer_id:"cus_test"});
    const live=new CreemGateway("live","key",secret);
    globalThis.fetch=async(url,init)=>{assert.equal(String(url),"https://api.creem.io/v1/products/prod_starter");assert.equal(init?.method,"GET");return Response.json({id:"prod_starter",mode:"prod",status:"active",price:699,currency:"USD",billing_type:"onetime"});};
    await live.validateProduct("prod_starter",PLAN_OFFERS.starter);
    globalThis.fetch=async()=>Response.json({id:"prod_starter",mode:"prod",status:"active",price:999,currency:"USD",billing_type:"onetime"});
    await assert.rejects(live.validateProduct("prod_starter",PLAN_OFFERS.starter),{code:"PRODUCT_MISMATCH"});
  } finally {globalThis.fetch=original;}
});
test("checkout creation retrieves an omitted request ID and rejects a foreign order", async () => {
  const original = globalThis.fetch;
  const gateway = new CreemGateway("test", "fixture-key", secret);
  const checkout = { id: "ch_sandbox", mode: "test", status: "pending", product: "prod_starter",
    checkout_url: "https://creem.io/test/checkout/prod_starter/ch_sandbox" };
  let requestId = "order-1";
  const requests: string[] = [];
  globalThis.fetch = async (url, init) => {
    requests.push(String(url));
    if (init?.method === "POST") return Response.json(checkout);
    assert.equal(String(url), "https://test-api.creem.io/v1/checkouts?checkout_id=ch_sandbox");
    return Response.json({ ...checkout, request_id: requestId });
  };
  const input = { orderId: "order-1", productId: "prod_starter", offerId: "starter",
    customerEmail: "user@example.com", successUrl: "https://site.example/billing/success" };
  try {
    assert.deepEqual(await gateway.createCheckout(input), { id: checkout.id, url: checkout.checkout_url });
    assert.equal(requests.length, 2);
    requestId = "another-order";
    await assert.rejects(gateway.createCheckout(input), { code: "CHECKOUT_MISMATCH" });
  } finally { globalThis.fetch = original; }
});
test("only active offers can create checkouts; Starter costs $6.99 for 500 credits",async()=>{
  assert.deepEqual(Object.keys(PLAN_OFFERS).sort(),["pro-month","pro-year","starter"]);
  assert.equal(PLAN_OFFERS.starter.amountCents,699);
  assert.equal(PLAN_OFFERS.starter.credits,500);
  assert.equal(PLAN_OFFERS['pro-month'].credits,2000);
  assert.equal(PLAN_OFFERS['pro-year'].credits,3000);
  assert.equal(PLAN_OFFERS['pro-year'].amountCents,7990);
  assert.equal(getOrderOffer("addon-1000")?.credits,1000);
  assert.equal(getOrderOffer("constructor"),undefined);
  assert.throws(()=>getProductBinding("addon-1000"),{code:"INVALID_OFFER"});
  await assert.rejects(createOrder("test-user","user@example.com","addon-1000"),{code:"INVALID_OFFER",status:400});
});
test("annual product validation requires the $79.90 yearly product",async()=>{
  const original=globalThis.fetch;const gateway=new CreemGateway('test','key',secret);
  const product={id:'prod_annual',mode:'test',status:'active',price:7990,currency:'USD',billing_type:'recurring',billing_period:'every-year'};
  globalThis.fetch=async()=>Response.json(product);
  try {
    await gateway.validateProduct('prod_annual',PLAN_OFFERS['pro-year']);
    product.price=4990;
    await assert.rejects(gateway.validateProduct('prod_annual',PLAN_OFFERS['pro-year']),{code:'PRODUCT_MISMATCH'});
    product.price=7990;product.billing_period='every-month';
    await assert.rejects(gateway.validateProduct('prod_annual',PLAN_OFFERS['pro-year']),{code:'PRODUCT_MISMATCH'});
  } finally {globalThis.fetch=original;}
});
const database=process.env.TEST_DATABASE_URL;
if(database) {
  if(!/^describe_audit(?:_\w+)?$/.test(new URL(database).pathname.slice(1))) throw new Error("Use an isolated describe_audit database for billing tests.");
  process.env.DATABASE_URL=database;
}
after(async()=>{if(database) await getBillingPool().end();});
test("persistent billing and usage integration",{skip:!database},async t=>{
  const pool=getBillingPool();
  await t.test("guest concurrency permits one call; failed usage refunds once",async()=>{
    const guestId=randomUUID();const guestSource=randomUUID().replaceAll("-","").repeat(2);
    const results=await Promise.allSettled(Array.from({length:6},()=>reserveUsage({guestId,guestSource,requestId:randomUUID(),batch:false})));
    const successful=results.filter(result=>result.status==="fulfilled");
    assert.equal(successful.length,1);
    const reservation=successful[0].value;
    assert.equal((await getUsageStatus({guestId,guestSource})).remaining,0);
    await refundUsage(reservation.reservationId);await refundUsage(reservation.reservationId);
    assert.equal((await getUsageStatus({guestId,guestSource})).remaining,10);
    const next=await reserveUsage({guestId,guestSource,requestId:randomUUID(),batch:false});
    await completeUsage(next.reservationId);
    await assert.rejects(refundUsage(next.reservationId),{code:"USAGE_ALREADY_SETTLED"});
  });
  await t.test("account welcome grants cover two images with no daily refill; batch requires Pro",async()=>{
    const userId="test:"+randomUUID();const requestId=randomUUID();
    const initial=await getUsageStatus({userId});
    assert.equal(initial.remaining,20);
    assert.equal(initial.freeAllowance,20);
    assert.equal(initial.resetsAt,null);
    const first=await reserveUsage({userId,requestId,batch:false});
    await assert.rejects(reserveUsage({userId,requestId,batch:false}),{code:"REQUEST_ALREADY_USED"});
    await assert.rejects(reserveUsage({userId,requestId:randomUUID(),batch:true}),{code:"PRO_REQUIRED"});
    assert.equal(first.remaining,10);
    assert.equal((await getUsageStatus({userId})).remaining,10);
    const second=await reserveUsage({userId,requestId:randomUUID(),batch:false});
    await completeUsage(first.reservationId);await completeUsage(second.reservationId);
    await assert.rejects(reserveUsage({userId,requestId:randomUUID(),batch:false}),{code:"QUOTA_EXCEEDED"});
    await pool.query("UPDATE credit_grants SET starts_at=now()-interval '2 days' WHERE owner_id=$1",["user:"+userId]);
    assert.equal((await getUsageStatus({userId})).remaining,0);
    const {rows:[grant]}=await pool.query("SELECT count(*)::int AS n,sum(amount)::int AS amount FROM credit_grants WHERE owner_id=$1",["user:"+userId]);
    assert.deepEqual(grant,{n:1,amount:20});
  });
  await t.test("concurrent account requests cannot exceed the two welcome credits",async()=>{
    const userId="test:"+randomUUID();
    const results=await Promise.allSettled(Array.from({length:6},()=>reserveUsage({userId,requestId:randomUUID(),batch:false})));
    const successful=results.filter(result=>result.status==="fulfilled");
    assert.equal(successful.length,2);
    assert.equal((await getUsageStatus({userId})).freeRemaining,0);
    await refundUsage(successful[0].value.reservationId);
    await refundUsage(successful[0].value.reservationId);
    assert.equal((await getUsageStatus({userId})).freeRemaining,10);
  });
  await t.test("legacy daily grants cannot be spent; welcome credits precede paid credits",async()=>{
    const userId="test:"+randomUUID();const ownerId="user:"+userId;const dailyId="daily:"+randomUUID();
    await transaction(async db=>{
      await grantCredits(db,{id:dailyId,ownerId,kind:"daily",amount:10,startsAt:new Date(Date.now()-3600000),expiresAt:new Date(Date.now()+86400000)});
      await grantCredits(db,{id:"paid:"+randomUUID(),ownerId,kind:"purchase",amount:5,startsAt:new Date(Date.now()-7200000)});
    });
    const initial=await getUsageStatus({userId});
    assert.equal(initial.freeRemaining,20);assert.equal(initial.paidRemaining,5);
    for(let n=0;n<2;n++){
      const reservation=await reserveUsage({userId,requestId:randomUUID(),batch:false});
      await completeUsage(reservation.reservationId);
    }
    const usage=await getUsageStatus({userId});
    assert.equal(usage.freeRemaining,0);assert.equal(usage.paidRemaining,5);
    const {rows:[legacy]}=await pool.query("SELECT remaining FROM credit_grants WHERE id=$1",[dailyId]);
    assert.equal(legacy.remaining,10);
  });
  async function fixture(offerId="starter",amountCents?:number,creditAmount?:number) {
    const suffix=randomUUID().replaceAll("-","");const orderId=randomUUID();const userId="test:"+suffix;
    const offer=getOrderOffer(offerId);assert.ok(offer);
    const amount=amountCents??offer.amountCents;
    const credits=creditAmount ?? (offerId==='pro-year' && amount===4990 ? 2000 : offer.credits);
    const productId="prod_"+suffix;const checkoutId="ch_"+suffix;const transactionId="txn_"+suffix;const customerId="cus_"+suffix;
    const subId=offer.billingType==="recurring" ? "sub_"+suffix : null;
    await pool.query("INSERT INTO billing_orders(id,user_id,offer_id,product_id,environment,amount_cents,checkout_id,credit_amount) VALUES ($1,$2,$3,$4,'test',$5,$6,$7)",[orderId,userId,offerId,productId,amount,checkoutId,credits]);
    const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
    const end=monthBoundary(start,offerId==="pro-year"?12:1);
    const checkout={id:checkoutId,mode:"test",status:"completed",units:1,request_id:orderId,product:productId,customer:customerId,subscription:subId,order:{id:"ord_"+suffix,transaction:transactionId}};
    const payment={id:transactionId,mode:"test",status:"paid",amount,amount_paid:amount,currency:"USD",discount_amount:0,refunded_amount:0,type:subId?"invoice":"payment",customer:customerId,order:"ord_"+suffix,subscription:subId,period_start:start.getTime(),period_end:end.getTime()};
    const subscription={id:subId,mode:"test",status:"active",product:productId,customer:customerId,metadata:{orderId},last_transaction_id:transactionId};
    const original=globalThis.fetch;
    globalThis.fetch=async(url,init)=>{
      assert.equal(init?.method,"GET");assert.equal(init?.redirect,"error");
      const target=new URL(String(url));assert.equal(target.origin,"https://test-api.creem.io");
      if(target.pathname==="/v1/checkouts" && target.searchParams.get("checkout_id")===checkoutId) return Response.json(checkout);
      if(target.pathname==="/v1/transactions" && target.searchParams.get("transaction_id")===transactionId) return Response.json(payment);
      if(target.pathname==="/v1/subscriptions" && target.searchParams.get("subscription_id")===subId) return Response.json(subscription);
      throw new Error("Unexpected provider request");
    };
    const gateway=new CreemGateway("test","key",secret);
    function event(type="checkout.completed",data:unknown=checkout,id="evt_"+randomUUID(),at=Date.now()){
      const raw=JSON.stringify({id,eventType:type,created_at:at,object:data});
      return {raw,signature:createHmac("sha256",secret).update(raw).digest("hex")};
    }
    const send=(e:ReturnType<typeof event>)=>processCreemEvent(e.raw,e.signature,gateway);
    return {orderId,userId,checkout,payment,subscription,event,send,restore:()=>{globalThis.fetch=original;}};
  }
  await t.test("duplicate signed payments mint once, foreign orders stay private, refunds cannot be replayed",async()=>{
    const f=await fixture();
    try {
      const e=f.event();
      await Promise.all([f.send(e),f.send(e),f.send(e)]);
      await f.send(f.event());
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,500);
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).status,"confirmed");
      const {rows:[evidence]}=await pool.query("SELECT amount_paid,currency,refunded_amount,paid_at FROM billing_payments WHERE transaction_id=$1",[f.payment.id]);
      assert.equal(evidence.amount_paid,699);assert.equal(evidence.currency,"USD");assert.equal(evidence.refunded_amount,0);assert.ok(evidence.paid_at instanceof Date);
      assert.ok((await pool.query("SELECT 1 FROM webhook_attempts WHERE event_id=$1 AND order_id=$2 AND result='succeeded'",[JSON.parse(e.raw).id,f.orderId])).rowCount);
      await assert.rejects(getOwnedOrder(f.orderId,"another-user"),{status:404});
      const old=e.raw;
      await assert.rejects(f.send({...e,raw:old+" "}),{status:401});
      f.payment.status="refunded";f.payment.refunded_amount=699;
      await f.send(f.event("refund.created",{transaction:f.payment.id,status:"succeeded"}));
      await f.send(f.event());
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).status,"revoked");
      const {rows:[refunds]}=await pool.query("SELECT count(*)::int AS n,sum(amount)::int AS amount FROM payment_refunds WHERE transaction_id=$1",[f.payment.id]);
      assert.equal(refunds.n,1);assert.equal(refunds.amount,699);
      const {rows:[reversedEvidence]}=await pool.query("SELECT amount_paid,refunded_amount FROM billing_payments WHERE transaction_id=$1",[f.payment.id]);
      assert.equal(reversedEvidence.amount_paid,699);assert.equal(reversedEvidence.refunded_amount,699);
    } finally {f.restore();}
  });
  await t.test("mismatched transaction amount and environment never grant credits",async()=>{
    const f=await fixture();
    try {
      f.payment.amount=1;
      await assert.rejects(f.send(f.event()),{code:"PAYMENT_EVIDENCE_MISMATCH"});
      f.payment.amount=699;f.payment.mode="prod";
      await assert.rejects(f.send(f.event()),{code:"PAYMENT_MODE_MISMATCH"});
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
    } finally {f.restore();}
  });
  await t.test("previous-price Starter orders still fulfill using their stored amount",async()=>{
    const f=await fixture("starter",999,300);
    try {
      await f.send(f.event());
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,300);
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).amount_cents,999);
    } finally {f.restore();}
  });
  await t.test("previous $6.99 Starter orders retain 300 credits through delayed payment and refund",async()=>{
    const f=await fixture("starter",699,300);
    try {
      await f.send(f.event());
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).credit_amount,300);
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,300);
      f.payment.status="refunded";f.payment.refunded_amount=699;
      await f.send(f.event("refund.created",{transaction:f.payment.id,status:"succeeded"}));
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
    } finally {f.restore();}
  });
  await t.test("historical add-on payments reconcile and refund after the offer is retired",async()=>{
    const f=await fixture("addon-1000");
    try {
      const e=f.event();await f.send(e);await f.send(e);
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,1000);
      f.payment.status="refunded";f.payment.refunded_amount=500;
      await f.send(f.event("refund.created",{transaction:f.payment.id}));
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
    } finally {f.restore();}
  });
  await t.test("annual payment creates twelve monthly windows; checkout alone grants no Pro",async()=>{
    const f=await fixture("pro-year");
    try {
      await f.send(f.event());
      assert.equal((await getUsageStatus({userId:f.userId})).isPro,false);
      await f.send(f.event("subscription.paid",f.subscription));
      const usage=await getUsageStatus({userId:f.userId});
      assert.equal(usage.paidRemaining,3000);assert.equal(usage.canBatch,true);
      const {rows:[grants]}=await pool.query("SELECT count(*)::int AS n,sum(amount)::int AS total FROM credit_grants WHERE payment_id=$1",[f.payment.id]);
      assert.deepEqual(grants,{n:12,total:36000});
      const reservation=await reserveUsage({userId:f.userId,requestId:randomUUID(),batch:true});
      await refundUsage(reservation.reservationId);
      f.subscription.status="canceled";
      await f.send(f.event("subscription.canceled",f.subscription,"evt_"+randomUUID(),Date.now()+100));
      assert.equal((await getUsageStatus({userId:f.userId})).isPro,true);
      f.payment.status="refunded";f.payment.refunded_amount=7990;
      await f.send(f.event("refund.created",{transaction:f.payment.id}));
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
      assert.equal((await getUsageStatus({userId:f.userId})).isPro,false);
    } finally {f.restore();}
  });
  await t.test("legacy annual orders keep their stored 2,000-credit monthly entitlement",async()=>{
    const f=await fixture('pro-year',4990);
    try {
      await f.send(f.event('subscription.paid',f.subscription));
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,2000);
      const {rows:[grants]}=await pool.query('SELECT count(*)::int AS n,sum(amount)::int AS total FROM credit_grants WHERE payment_id=$1',[f.payment.id]);
      assert.deepEqual(grants,{n:12,total:24000});
    } finally {f.restore();}
  });
  await t.test("monthly entitlements deduct ten credits per image and refund the exact charge",async()=>{
    const f=await fixture('pro-month');
    try {
      await f.send(f.event('subscription.paid',f.subscription));
      const first=await reserveUsage({userId:f.userId,requestId:randomUUID(),batch:true});
      const second=await reserveUsage({userId:f.userId,requestId:randomUUID(),batch:true});
      await completeUsage(first.reservationId);await completeUsage(second.reservationId);
      const third=await reserveUsage({userId:f.userId,requestId:randomUUID(),batch:true,units:3});
      assert.equal(third.remaining,1970);
      const {rows:[allocation]}=await pool.query('SELECT sum(amount)::int AS amount FROM usage_allocations WHERE reservation_id=$1',[third.reservationId]);
      assert.equal(allocation.amount,30);
      await refundUsage(third.reservationId);await refundUsage(third.reservationId);
      assert.equal((await getUsageStatus({userId:f.userId})).remaining,2000);
      await pool.query('UPDATE credit_grants SET remaining=9 WHERE payment_id=$1',[f.payment.id]);
      await assert.rejects(reserveUsage({userId:f.userId,requestId:randomUUID(),batch:false}),{code:'QUOTA_EXCEEDED'});
    } finally {f.restore();}
  });
  await t.test("free-credit denomination migration is repeatable and refunds pre-migration reservations",async()=>{
    const guestId=randomUUID();const guestSource=randomUUID().replaceAll("-","").repeat(2);const ownerId='guest:'+guestId;const grantId='guest:'+ownerId;const reservationId=randomUUID();
    await transaction(async db=>{
      await grantCredits(db,{id:grantId,ownerId,kind:'guest',amount:1,startsAt:new Date(Date.now()-1000)});
      await db.query("INSERT INTO usage_reservations(id,owner_id,request_id,units,batch,status,credits_per_image) VALUES ($1,$2,$3,1,false,'reserved',1)",[reservationId,ownerId,randomUUID()]);
      await db.query('INSERT INTO usage_allocations VALUES ($1,$2,1)',[reservationId,grantId]);
      await db.query('UPDATE credit_grants SET remaining=0 WHERE id=$1',[grantId]);
      await db.query("INSERT INTO credit_ledger(grant_id,reference_id,kind,delta) VALUES ($1,$2,'reserve',-1)",[grantId,reservationId]);
    });
    const unspentGuest=randomUUID();const unspentGrant='guest:guest:'+unspentGuest;
    await transaction(db=>grantCredits(db,{id:unspentGrant,ownerId:'guest:'+unspentGuest,kind:'guest',amount:1,startsAt:new Date(Date.now()-1000)}));
    const migration=await readFile(new URL('../migrations/004_plan_terms.sql',import.meta.url),'utf8');
    await pool.query(migration);await pool.query(migration);
    assert.equal((await getUsageStatus({guestId:unspentGuest,guestSource:randomUUID().replaceAll("-","").repeat(2)})).remaining,10);
    const {rows:[ledger]}=await pool.query('SELECT sum(delta)::int AS balance FROM credit_ledger WHERE grant_id=$1',[unspentGrant]);
    assert.equal(ledger.balance,10);
    assert.equal((await getUsageStatus({guestId,guestSource})).remaining,0);
    await refundUsage(reservationId);await refundUsage(reservationId);
    assert.equal((await getUsageStatus({guestId,guestSource})).remaining,10);
    const next=await reserveUsage({guestId,guestSource,requestId:randomUUID(),batch:false});
    await completeUsage(next.reservationId);
    assert.equal((await getUsageStatus({guestId,guestSource})).remaining,0);
  });
});
