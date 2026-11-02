import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { CreemGateway, verifyCreemSignature, validateCheckoutUrl } from "../providers/creem";
import { PLAN_OFFERS } from "../types";
import { monthBoundary, processCreemEvent } from "../events";
import { getBillingPool } from "../db";
import { getOwnedOrder } from "../orders";
import { completeUsage, getUsageStatus, refundUsage, reserveUsage } from "../usage";

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
    if(String(url).endsWith("/v1/products/prod_starter")) return Response.json({id:"prod_starter",mode:"test",status:"active",price:999,currency:"USD",billing_type:"onetime"});
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
    globalThis.fetch=async(url,init)=>{assert.equal(String(url),"https://api.creem.io/v1/products/prod_starter");assert.equal(init?.method,"GET");return Response.json({id:"prod_starter",mode:"prod",status:"active",price:999,currency:"USD",billing_type:"onetime"});};
    await live.validateProduct("prod_starter",PLAN_OFFERS.starter);
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
    const guestId=randomUUID();
    const results=await Promise.allSettled(Array.from({length:6},()=>reserveUsage({guestId,requestId:randomUUID(),batch:false})));
    const successful=results.filter(result=>result.status==="fulfilled");
    assert.equal(successful.length,1);
    const reservation=successful[0].value;
    assert.equal((await getUsageStatus({guestId})).remaining,0);
    await refundUsage(reservation.reservationId);await refundUsage(reservation.reservationId);
    assert.equal((await getUsageStatus({guestId})).remaining,1);
    const next=await reserveUsage({guestId,requestId:randomUUID(),batch:false});
    await completeUsage(next.reservationId);
    await assert.rejects(refundUsage(next.reservationId),{code:"USAGE_ALREADY_SETTLED"});
  });
  await t.test("authenticated daily allowance is ten and batch requires Pro",async()=>{
    const userId="test:"+randomUUID();const requestId=randomUUID();
    assert.equal((await getUsageStatus({userId})).remaining,10);
    await reserveUsage({userId,requestId,batch:false});
    await assert.rejects(reserveUsage({userId,requestId,batch:false}),{code:"REQUEST_ALREADY_USED"});
    await assert.rejects(reserveUsage({userId,requestId:randomUUID(),batch:true}),{code:"PRO_REQUIRED"});
    assert.equal((await getUsageStatus({userId})).remaining,9);
  });
  async function fixture(offerId="starter") {
    const suffix=randomUUID().replaceAll("-","");const orderId=randomUUID();const userId="test:"+suffix;
    const offer=PLAN_OFFERS[offerId];const productId="prod_"+suffix;const checkoutId="ch_"+suffix;const transactionId="txn_"+suffix;const customerId="cus_"+suffix;
    const subId=offer.billingType==="recurring" ? "sub_"+suffix : null;
    await pool.query("INSERT INTO billing_orders(id,user_id,offer_id,product_id,environment,amount_cents,checkout_id) VALUES ($1,$2,$3,$4,'test',$5,$6)",[orderId,userId,offerId,productId,offer.amountCents,checkoutId]);
    const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
    const end=monthBoundary(start,offerId==="pro-year"?12:1);
    const checkout={id:checkoutId,mode:"test",status:"completed",units:1,request_id:orderId,product:productId,customer:customerId,subscription:subId,order:{id:"ord_"+suffix,transaction:transactionId}};
    const payment={id:transactionId,mode:"test",status:"paid",amount:offer.amountCents,amount_paid:offer.amountCents,currency:"USD",discount_amount:0,refunded_amount:0,type:subId?"invoice":"payment",customer:customerId,order:"ord_"+suffix,subscription:subId,period_start:start.getTime(),period_end:end.getTime()};
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
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,300);
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).status,"confirmed");
      await assert.rejects(getOwnedOrder(f.orderId,"another-user"),{status:404});
      const old=e.raw;
      await assert.rejects(f.send({...e,raw:old+" "}),{status:401});
      f.payment.status="refunded";f.payment.refunded_amount=999;
      await f.send(f.event("refund.created",{transaction:f.payment.id,status:"succeeded"}));
      await f.send(f.event());
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
      assert.equal((await getOwnedOrder(f.orderId,f.userId)).status,"revoked");
    } finally {f.restore();}
  });
  await t.test("mismatched transaction amount and environment never grant credits",async()=>{
    const f=await fixture();
    try {
      f.payment.amount=1;
      await assert.rejects(f.send(f.event()),{code:"PAYMENT_EVIDENCE_MISMATCH"});
      f.payment.amount=999;f.payment.mode="prod";
      await assert.rejects(f.send(f.event()),{code:"PAYMENT_MODE_MISMATCH"});
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
      assert.equal(usage.paidRemaining,2000);assert.equal(usage.canBatch,true);
      const {rows:[grants]}=await pool.query("SELECT count(*)::int AS n,sum(amount)::int AS total FROM credit_grants WHERE payment_id=$1",[f.payment.id]);
      assert.deepEqual(grants,{n:12,total:24000});
      const reservation=await reserveUsage({userId:f.userId,requestId:randomUUID(),batch:true});
      await refundUsage(reservation.reservationId);
      f.subscription.status="canceled";
      await f.send(f.event("subscription.canceled",f.subscription,"evt_"+randomUUID(),Date.now()+100));
      assert.equal((await getUsageStatus({userId:f.userId})).isPro,true);
      f.payment.status="refunded";f.payment.refunded_amount=4990;
      await f.send(f.event("refund.created",{transaction:f.payment.id}));
      assert.equal((await getUsageStatus({userId:f.userId})).paidRemaining,0);
      assert.equal((await getUsageStatus({userId:f.userId})).isPro,false);
    } finally {f.restore();}
  });
});
