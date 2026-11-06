import { getBillingPool, transaction } from "../billing/db";
import { HttpError } from "../http";
import { hasAuthConfiguration } from "../../auth.configuration";
import { visionReady } from "../vision";
import { moderationReady } from "../moderation";
import { adminUserIds } from "./identity";
import { parseAdminFilters, type AdminFilters } from "./filters";

const PAGE_SIZE = 25;
export type AdminRow = Record<string, unknown>;
export type AdminList = { items: AdminRow[]; nextCursor: string | null; environment: string };

const sources = {
  users: `SELECT u.*,u.id AS user_id,
    (SELECT coalesce(sum(remaining),0)::int FROM credit_grants g WHERE g.owner_id='user:'||u.id AND NOT revoked
      AND kind IN ('welcome','guest','purchase','subscription','compensation') AND starts_at<=now() AND(expires_at IS NULL OR expires_at>now())) AS credits,
    (SELECT count(*)::int FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id WHERE o.user_id=u.id AND o.environment=$8) AS payments,
    (SELECT count(*)::int FROM usage_reservations r WHERE r.owner_id='user:'||u.id AND r.status='completed') AS descriptions,
    (SELECT o.offer_id FROM billing_subscriptions s JOIN billing_orders o ON o.id=s.order_id
      WHERE s.user_id=u.id AND o.environment=$8 AND s.paid_through>now() AND s.status IN ('active','scheduled_cancel','canceled') ORDER BY s.paid_through DESC LIMIT 1) AS plan,
    'user'::text AS kind FROM app_users u`,
  orders: `SELECT o.id::text,o.created_at,o.user_id,u.email,o.offer_id,o.environment,o.amount_cents,o.currency,o.credit_amount,o.status,
    o.confirmed_at,o.checkout_id,o.customer_id,o.subscription_id,coalesce(c.status,'open') AS case_status,c.note,
    'order'::text AS kind FROM billing_orders o LEFT JOIN app_users u ON u.id=o.user_id
    LEFT JOIN operation_cases c ON c.source_type='order' AND c.source_id=o.id::text WHERE o.environment=$8`,
  payments: `SELECT p.transaction_id AS id,p.created_at,o.user_id,u.email,p.order_id::text,o.offer_id,o.environment,
    p.amount_paid,p.currency,p.refunded_amount,p.paid_at,p.period_start,p.period_end,p.provider_status,p.evidence_at,
    CASE WHEN p.revoked THEN 'reversed' ELSE 'confirmed' END AS status,
    (SELECT coalesce(sum(g.amount),0)::int FROM credit_grants g WHERE g.payment_id=p.transaction_id) AS issued_credits,
    (SELECT coalesce(sum(g.remaining),0)::int FROM credit_grants g WHERE g.payment_id=p.transaction_id AND NOT g.revoked) AS unspent_credits,
    'payment'::text AS kind FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id LEFT JOIN app_users u ON u.id=o.user_id WHERE o.environment=$8`,
  subscriptions: `SELECT s.id,o.created_at,s.user_id,u.email,s.order_id::text,o.offer_id,o.environment,o.credit_amount,s.status,s.paid_through,s.last_event_at,
    (s.paid_through>now() AND s.status IN ('active','canceled','scheduled_cancel')) AS has_access,
    'subscription'::text AS kind FROM billing_subscriptions s JOIN billing_orders o ON o.id=s.order_id LEFT JOIN app_users u ON u.id=s.user_id WHERE o.environment=$8`,
  grants: `SELECT g.id,g.starts_at AS created_at,CASE WHEN g.owner_id LIKE 'user:%' THEN substring(g.owner_id FROM 6) ELSE NULL END AS user_id,u.email,
    g.owner_id,g.kind AS status,g.amount,g.remaining,g.starts_at,g.expires_at,g.payment_id,g.revoked,
    (NOT g.revoked AND g.remaining>0 AND g.starts_at<=now() AND(g.expires_at IS NULL OR g.expires_at>now())) AS spendable,'grant'::text AS kind
    FROM credit_grants g LEFT JOIN app_users u ON g.owner_id='user:'||u.id`,
  ledger: `SELECT l.id::text,l.created_at,CASE WHEN g.owner_id LIKE 'user:%' THEN substring(g.owner_id FROM 6) ELSE NULL END AS user_id,u.email,
    g.owner_id,l.grant_id,l.reference_id,l.kind AS status,l.delta,g.kind AS source,'ledger'::text AS kind
    FROM credit_ledger l JOIN credit_grants g ON g.id=l.grant_id LEFT JOIN app_users u ON g.owner_id='user:'||u.id`,
  reservations: `SELECT r.id::text,r.created_at,CASE WHEN r.owner_id LIKE 'user:%' THEN substring(r.owner_id FROM 6) ELSE NULL END AS user_id,u.email,
    r.owner_id,r.request_id,r.units,r.batch,r.status,r.credits_per_image,
    r.status='reserved' AND r.created_at<now()-interval '5 minutes' AS recoverable,
    coalesce(c.status,'open') AS case_status,c.note,'reservation'::text AS kind
    FROM usage_reservations r LEFT JOIN app_users u ON r.owner_id='user:'||u.id
    LEFT JOIN operation_cases c ON c.source_type='reservation' AND c.source_id=r.id::text`,
  requests: `SELECT r.id::text,r.created_at,CASE WHEN r.owner_id LIKE 'user:%' THEN substring(r.owner_id FROM 6) ELSE NULL END AS user_id,u.email,
    r.owner_id,r.client_request_id,r.reservation_id::text,r.language,r.batch,r.units,r.model,r.stage,r.result AS status,r.error_code,r.moderation,r.stages,
    r.completed_at,r.duration_ms,v.status AS reservation_status,v.credits_per_image,
    coalesce(c.status,'open') AS case_status,c.note,'request'::text AS kind FROM generation_requests r
    LEFT JOIN usage_reservations v ON v.id=r.reservation_id LEFT JOIN app_users u ON r.owner_id='user:'||u.id
    LEFT JOIN operation_cases c ON c.source_type='request' AND c.source_id=r.id::text`,
  webhooks: `SELECT w.id::text,w.created_at,NULL::text AS user_id,w.event_id,w.event_type,w.order_id,w.result AS status,w.error_code,
    (SELECT count(*)::int FROM webhook_attempts a WHERE a.event_id=w.event_id) AS attempts,
    coalesce(c.status,'open') AS case_status,c.note,'webhook'::text AS kind FROM webhook_attempts w
    LEFT JOIN operation_cases c ON c.source_type='webhook' AND c.source_id=w.id::text`,
  tasks: `SELECT t.id::text,t.started_at AS created_at,NULL::text AS user_id,t.name,t.status,t.processed,t.error_code,t.finished_at,
    coalesce(c.status,'open') AS case_status,c.note,'task'::text AS kind FROM operation_tasks t
    LEFT JOIN operation_cases c ON c.source_type='task' AND c.source_id=t.id::text`,
  audit: `SELECT a.id::text,a.created_at,a.actor_id AS user_id,a.actor_id,a.action,a.target,a.reason,a.summary,a.result AS status,a.error_code,'audit'::text AS kind FROM admin_audit a`,
  cases: `SELECT c.source_type||':'||c.source_id AS id,c.updated_at AS created_at,c.actor_id AS user_id,c.source_type,c.source_id,c.status,c.note,c.actor_id,'case'::text AS kind FROM operation_cases c`,
} as const;
export type AdminResource = keyof typeof sources;

function ensureResource(resource: string): asserts resource is AdminResource {
  if (!Object.hasOwn(sources, resource)) throw new HttpError(404, "This administration view was not found.");
}

export async function getAdminList(resource: string, params: URLSearchParams): Promise<AdminList> {
  ensureResource(resource);
  const f = parseAdminFilters(params);
  const values = [f.q, f.status, f.user, f.from, f.to, f.cursor?.at ?? null, f.cursor?.id ?? null, f.environment, f.plan];
  // All SQL fragments come from this allowlist. User input is bound as parameters.
  const { rows } = await getBillingPool().query(`WITH data AS (${sources[resource]}) SELECT data.*,
    to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_at FROM data
    WHERE ($1::text='' OR concat_ws(' ',id,user_id,${resource === "users" ? "email,name" : resource === "audit" ? "actor_id,target,action,reason" : resource === "requests" ? "email,client_request_id,reservation_id,error_code" : resource === "webhooks" ? "event_id,event_type,error_code" : resource === "orders" ? "email,checkout_id,subscription_id" : resource === "payments" ? "email,order_id" : resource === "subscriptions" ? "email,order_id" : resource === "ledger" ? "email,grant_id,reference_id" : resource === "grants" ? "email,owner_id,payment_id" : resource === "reservations" ? "email,owner_id,request_id" : resource === "tasks" ? "name,error_code" : "source_id,note"}) ILIKE '%'||$1||'%')
    AND ($2::text='' OR status=$2) AND ($3::text='' OR user_id=$3)
    AND ($4::timestamptz IS NULL OR created_at >= $4) AND ($5::timestamptz IS NULL OR created_at < $5)
    AND ($6::timestamptz IS NULL OR (created_at,id)<($6::timestamptz,$7::text))
    AND $8::text IN ('test','live') AND ($9::text='' OR ${resource === "users" ? "coalesce(plan,'free')=$9" : "$9::text<>''"})
    ORDER BY created_at DESC,id DESC LIMIT ${PAGE_SIZE + 1}`, values);
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? Buffer.from(JSON.stringify({ at: last.cursor_at, id: last.id })).toString("base64url") : null, environment: f.environment };
}

export async function getAdminDetail(resource: string, id: string, environment: string) {
  ensureResource(resource);
  if (!id || id.length > 256 || !["test", "live"].includes(environment)) throw new HttpError(400, "Invalid detail reference.");
  const values = [null, null, null, null, null, null, null, environment, id];
  const { rows: [item] } = await getBillingPool().query(`WITH data AS (${sources[resource]}) SELECT * FROM data WHERE id=$9::text AND $1::text IS NULL AND $2::text IS NULL AND $3::text IS NULL AND $4::text IS NULL AND $5::text IS NULL AND $6::text IS NULL AND $7::text IS NULL AND $8::text IN ('test','live')`, values);
  if (!item) throw new HttpError(404, "This record was not found in the selected environment.");
  return item as AdminRow;
}

export async function getAdminQueue() {
  const { rows } = await getBillingPool().query(`WITH candidates AS (
    SELECT 'reservation' AS source_type,r.id::text AS source_id,r.created_at,'超时积分预占' AS label,'/admin/credits?tab=reservations&status=reserved' AS href
      FROM usage_reservations r WHERE r.status='reserved' AND r.created_at < now()-interval '5 minutes'
    UNION ALL SELECT 'order',o.id::text,o.created_at,'待核对订单','/admin/billing?tab=orders&status=pending' FROM billing_orders o
      WHERE o.environment=$1 AND o.status='pending' AND o.created_at < now()-interval '15 minutes' AND o.created_at > now()-interval '7 days'
    UNION ALL SELECT 'order',o.id::text,o.created_at,'支付权益待核对','/admin/billing?tab=orders&status=confirmed' FROM billing_orders o
      WHERE o.environment=$1 AND EXISTS(SELECT 1 FROM billing_payments p WHERE p.order_id=o.id AND NOT p.revoked
        AND NOT EXISTS(SELECT 1 FROM credit_grants g WHERE g.payment_id=p.transaction_id))
    UNION ALL SELECT 'webhook',w.id::text,w.created_at,'支付回调失败','/admin/operations?tab=webhooks&status=failed' FROM webhook_attempts w
      WHERE w.result='failed' AND w.created_at > now()-interval '7 days' AND NOT EXISTS(
        SELECT 1 FROM webhook_attempts newer WHERE newer.event_id=w.event_id AND newer.created_at>w.created_at)
    UNION ALL SELECT 'task',t.id::text,t.started_at,'恢复任务异常','/admin/operations?tab=tasks' FROM operation_tasks t
      WHERE t.status='failed' OR (t.status='running' AND t.started_at < now()-interval '10 minutes')
    UNION ALL SELECT 'request',r.id::text,r.created_at,'生成服务故障','/admin/requests?status='||r.result FROM generation_requests r
      WHERE r.result IN ('moderation_failed','model_failed','service_failed') AND r.created_at > now()-interval '24 hours'
  ) SELECT s.*,coalesce(c.status,'open') AS case_status,c.note FROM candidates s
    LEFT JOIN operation_cases c ON c.source_type=s.source_type AND c.source_id=s.source_id
    WHERE coalesce(c.status,'open') <> 'resolved' ORDER BY s.created_at DESC,s.source_id DESC LIMIT 100`, [process.env.CREEM_ENVIRONMENT || "test"]);
  return rows;
}

function overviewRange(f: AdminFilters) {
  const now = new Date();
  const day = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0,10);
  const tomorrow = new Date(Date.parse(`${day}T00:00:00+08:00`) + 86400000).toISOString();
  const to = f.to ?? tomorrow;
  const from = f.from ?? new Date(Date.parse(to) - f.days * 86400000).toISOString();
  if ((Date.parse(to)-Date.parse(from))/86400000 > 366) throw new HttpError(400, "Choose a range of 366 days or less.");
  return { from, to };
}

export async function getAdminOverview(params: URLSearchParams) {
  const f = parseAdminFilters(params);
  const { from, to } = overviewRange(f);
  const snapshot = await transaction(async db => {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const metrics = await db.query(`SELECT
      (SELECT count(*)::int FROM app_users WHERE NOT historical AND created_at >= $1 AND created_at < $2) AS new_users,
      (SELECT count(DISTINCT owner_id)::int FROM generation_requests WHERE result='succeeded' AND owner_id LIKE 'user:%' AND completed_at >= $1 AND completed_at < $2) AS active_users,
      (SELECT count(DISTINCT owner_id)::int FROM generation_requests WHERE result='succeeded' AND owner_id LIKE 'guest:%' AND completed_at >= $1 AND completed_at < $2) AS active_guests,
      (SELECT coalesce(sum(units),0)::int FROM generation_requests WHERE result='succeeded' AND completed_at >= $1 AND completed_at < $2) AS images,
      (SELECT count(*)::int FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id WHERE o.environment=$3 AND coalesce(p.paid_at,p.created_at) >= $1 AND coalesce(p.paid_at,p.created_at) < $2) AS payments,
      (SELECT coalesce(sum(p.amount_paid),0)::bigint FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id WHERE o.environment=$3 AND p.paid_at >= $1 AND p.paid_at < $2 AND p.currency='USD') AS gross_cents,
      (SELECT count(*)::int FROM billing_payments p JOIN billing_orders o ON o.id=p.order_id WHERE o.environment=$3 AND coalesce(p.paid_at,p.created_at) >= $1 AND coalesce(p.paid_at,p.created_at) < $2 AND (p.amount_paid IS NULL OR p.paid_at IS NULL)) AS unknown_payments,
      (SELECT coalesce(sum(r.amount),0)::bigint FROM payment_refunds r JOIN billing_payments p ON p.transaction_id=r.transaction_id JOIN billing_orders o ON o.id=p.order_id WHERE o.environment=$3 AND r.occurred_at >= $1 AND r.occurred_at < $2 AND r.currency='USD') AS refund_cents,
      (SELECT count(DISTINCT s.user_id)::int FROM billing_subscriptions s JOIN billing_orders o ON o.id=s.order_id WHERE o.environment=$3 AND s.paid_through>now() AND s.status IN ('active','scheduled_cancel','canceled')) AS pro_users,
      (SELECT -coalesce(sum(CASE WHEN l.kind='reserve' AND r.credits_per_image=1 AND g.kind IN ('guest','welcome') THEN l.delta*10 ELSE l.delta END),0)::bigint
        FROM credit_ledger l JOIN credit_grants g ON g.id=l.grant_id LEFT JOIN usage_reservations r ON r.id::text=l.reference_id
        WHERE l.kind IN ('reserve','refund') AND l.created_at >= $1 AND l.created_at < $2) AS credits_consumed,
      (SELECT min(created_at) FROM generation_requests) AS tracking_since,
      (SELECT count(*)::int FROM generation_requests WHERE reservation_id IS NOT NULL AND created_at >= $1 AND created_at < $2) AS reserved_requests,
      (SELECT count(*)::int FROM generation_requests WHERE result='succeeded' AND created_at >= $1 AND created_at < $2) AS successful_requests,
      (SELECT count(*)::int FROM generation_requests WHERE result IN ('moderation_failed','model_failed') AND created_at >= $1 AND created_at < $2) AS technical_failures,
      (SELECT count(*)::int FROM generation_requests WHERE result='blocked' AND created_at >= $1 AND created_at < $2) AS blocked,
      (SELECT count(*)::int FROM generation_requests WHERE result='processing' AND created_at >= $1 AND created_at < $2) AS processing`, [from,to,f.environment]);
    const trend = await db.query(`WITH days AS (SELECT generate_series($1::timestamptz,$2::timestamptz-interval '1 day',interval '1 day') AS day)
      SELECT to_char(day AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS day,
      (SELECT coalesce(sum(units),0)::int FROM generation_requests WHERE result='succeeded' AND completed_at>=day AND completed_at<day+interval '1 day') AS images
      FROM days ORDER BY day`, [from,to]);
    return { metrics: metrics.rows[0], trend: trend.rows };
  });
  const coverage = snapshot.metrics.tracking_since ? new Date(snapshot.metrics.tracking_since).getTime() : null;
  const trend = snapshot.trend.map(row => ({ ...row, images: coverage !== null && Date.parse(`${row.day}T00:00:00+08:00`)+86400000>coverage ? row.images : null }));
  return { ...snapshot, trend, queue: await getAdminQueue(), from, to, environment: f.environment, capturedAt: new Date().toISOString() };
}

export async function getAdminOperations() {
  const pool = getBillingPool();
  const [settings, probes, task] = await Promise.all([
    pool.query("SELECT pause_generation,pause_checkout,updated_at FROM operation_settings WHERE id=true"),
    pool.query("SELECT service,status,checked_at FROM operation_probes"),
    pool.query("SELECT * FROM operation_tasks WHERE name='usage-recovery' ORDER BY started_at DESC LIMIT 1"),
  ]);
  const configured = {
    database: Boolean(process.env.DATABASE_URL), google: hasAuthConfiguration(), gemini: visionReady(), seeapi: moderationReady(),
    creem: Boolean(["test","live"].includes(process.env.CREEM_ENVIRONMENT ?? "") && process.env.CREEM_API_KEY && process.env.CREEM_WEBHOOK_SECRET && process.env.CREEM_PRODUCT_STARTER && process.env.CREEM_PRODUCT_PRO_MONTH && process.env.CREEM_PRODUCT_PRO_YEAR),
  };
  return { settings: settings.rows[0], probes: probes.rows, task: task.rows[0] ?? null, configured,
    administrators: adminUserIds(), environment: process.env.CREEM_ENVIRONMENT || "test",
    recoveryScheduleMinutes: Number(process.env.USAGE_RECOVERY_INTERVAL_MINUTES) || null,
    recoveryStale: Boolean(task.rows[0] && Date.now()-new Date(task.rows[0].started_at).getTime() > (Number(process.env.USAGE_RECOVERY_INTERVAL_MINUTES)||5)*2*60000),
    nextRecoveryAt: task.rows[0] && Number(process.env.USAGE_RECOVERY_INTERVAL_MINUTES)>0 ? new Date(new Date(task.rows[0].started_at).getTime()+Number(process.env.USAGE_RECOVERY_INTERVAL_MINUTES)*60000).toISOString() : null };
}
