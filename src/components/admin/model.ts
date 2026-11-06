export type Row = Record<string, unknown>;
export type ListData = { items: Row[]; nextCursor: string | null };
export type Column = { key: string; label: string; numeric?: boolean };

export const sections: Record<string, { title: string; description: string; tabs: [string, string][] }> = {
  overview: { title: "运营概览", description: "生成、支付与权益的运营快照。", tabs: [] },
  users: { title: "用户管理", description: "从账户查起，追踪订单、积分与生成请求。", tabs: [["users", "用户"]] },
  billing: { title: "订单与订阅", description: "核对交易凭证、购买权益与订阅有效期。", tabs: [["orders", "订单"], ["payments", "交易"], ["subscriptions", "订阅"]] },
  credits: { title: "积分与补偿", description: "查看积分来源、消费与退回，处理异常预占。", tabs: [["grants", "积分批次"], ["ledger", "积分流水"], ["reservations", "使用记录"]] },
  requests: { title: "生成与审核", description: "通过请求编号定位失败阶段与积分结算。", tabs: [["requests", "生成请求"]] },
  operations: { title: "系统与任务", description: "服务状态、运营开关与异常处理。", tabs: [["settings", "服务与开关"], ["webhooks", "支付回调"], ["tasks", "恢复任务"], ["queue", "异常待办"], ["cases", "处理记录"]] },
  audit: { title: "操作日志", description: "查阅操作者、操作理由与权益变更记录。", tabs: [["audit", "管理员操作"]] },
};
export const columns: Record<string, Column[]> = {
  users: [{key:"email",label:"用户"},{key:"created_at",label:"创建时间"},{key:"plan",label:"套餐"},{key:"credits",label:"积分",numeric:true},{key:"descriptions",label:"成功图片",numeric:true},{key:"payments",label:"交易",numeric:true},{key:"status",label:"状态"}],
  orders: [{key:"id",label:"订单"},{key:"email",label:"用户"},{key:"offer_id",label:"商品"},{key:"amount_cents",label:"订单金额",numeric:true},{key:"credit_amount",label:"权益积分",numeric:true},{key:"status",label:"状态"},{key:"created_at",label:"创建时间"}],
  payments: [{key:"id",label:"交易"},{key:"email",label:"用户"},{key:"amount_paid",label:"实收金额",numeric:true},{key:"refunded_amount",label:"退款金额",numeric:true},{key:"status",label:"权益状态"},{key:"paid_at",label:"支付事件时间"}],
  subscriptions: [{key:"id",label:"订阅"},{key:"email",label:"用户"},{key:"offer_id",label:"套餐"},{key:"status",label:"渠道状态"},{key:"has_access",label:"Pro 权益"},{key:"paid_through",label:"付费有效期"}],
  grants: [{key:"email",label:"用户 / 访客"},{key:"status",label:"积分来源"},{key:"amount",label:"发放",numeric:true},{key:"remaining",label:"剩余",numeric:true},{key:"spendable",label:"可用批次"},{key:"expires_at",label:"到期时间"},{key:"created_at",label:"生效时间"}],
  ledger: [{key:"email",label:"用户 / 访客"},{key:"status",label:"动作"},{key:"source",label:"来源"},{key:"delta",label:"积分变动",numeric:true},{key:"reference_id",label:"关联编号"},{key:"created_at",label:"发生时间"}],
  reservations: [{key:"id",label:"预占编号"},{key:"email",label:"用户 / 访客"},{key:"units",label:"图片",numeric:true},{key:"status",label:"结算状态"},{key:"recoverable",label:"恢复条件"},{key:"created_at",label:"开始时间"}],
  requests: [{key:"id",label:"请求编号"},{key:"email",label:"用户 / 访客"},{key:"language",label:"语言"},{key:"status",label:"生成结果"},{key:"duration_ms",label:"耗时",numeric:true},{key:"reservation_status",label:"积分结算"},{key:"created_at",label:"接收时间"}],
  webhooks: [{key:"event_id",label:"渠道事件"},{key:"event_type",label:"事件类型"},{key:"status",label:"处理结果"},{key:"error_code",label:"错误码"},{key:"attempts",label:"尝试",numeric:true},{key:"created_at",label:"接收时间"}],
  tasks: [{key:"name",label:"任务"},{key:"status",label:"执行结果"},{key:"processed",label:"恢复数量",numeric:true},{key:"error_code",label:"错误码"},{key:"created_at",label:"开始时间"},{key:"finished_at",label:"结束时间"}],
  audit: [{key:"actor_id",label:"操作者"},{key:"action",label:"操作"},{key:"target",label:"对象"},{key:"reason",label:"原因"},{key:"status",label:"结果"},{key:"created_at",label:"操作时间"}],
  cases: [{key:"source_type",label:"异常类型"},{key:"source_id",label:"关联编号"},{key:"status",label:"处理状态"},{key:"note",label:"处理记录"},{key:"actor_id",label:"处理人"},{key:"created_at",label:"更新时间"}],
};
export const words: Record<string,string> = {
  active:"正常", banned:"已封禁", pending:"待确认", confirmed:"已确认", failed:"失败", revoked:"已撤销", reversed:"已撤销", canceled:"已取消续订", scheduled_cancel:"计划取消", past_due:"逾期", unpaid:"未付款", expired:"已到期", paused:"已暂停",
  welcome:"欢迎积分", guest:"访客积分", daily:"历史每日积分", purchase:"购买积分", subscription:"订阅积分", compensation:"客服补偿", grant:"发放", reserve:"预占", refund:"退回", revoke:"撤销",
  reserved:"预占中", completed:"已扣费", refunded:"已退回", processing:"处理中", succeeded:"成功", duplicate:"重复事件", blocked:"内容拦截", moderation_failed:"审核服务失败", model_failed:"模型服务失败", service_failed:"服务故障", invalid:"输入或权限无效", quota_exceeded:"积分不足", rate_limited:"限流", suspended:"账户封禁", open:"待处理", resolved:"已处理", running:"运行中",
  "pro-month":"Pro 月付", "pro-year":"Pro 年付", starter:"Starter Pack", "addon-1000":"历史加量包", "usage-recovery":"异常预占恢复", ban:"封禁用户", unban:"解封用户", compensate:"补偿积分", recover:"退回异常预占", settings:"运营开关", case:"处理异常", probe:"数据库探测", received:"接收请求", validation:"输入校验", reservation:"预占积分", moderation:"内容审核", moderation_passed:"审核通过", generation:"模型生成", settlement:"积分结算", refund_pending:"退回待恢复", passed:"通过",
  order:"订单", webhook:"支付回调", request:"生成请求", task:"恢复任务", payment:"交易", ledger:"积分流水", user:"用户",
};
export const statuses: Record<string, string[]> = {
  users:["active","banned"],orders:["pending","confirmed","failed","revoked"],payments:["confirmed","reversed"],subscriptions:["active","scheduled_cancel","canceled","past_due","unpaid","expired","paused"],grants:["welcome","guest","purchase","subscription","compensation","daily"],ledger:["grant","reserve","refund","revoke"],reservations:["reserved","completed","refunded"],requests:["processing","succeeded","blocked","moderation_failed","model_failed","service_failed","invalid","quota_exceeded","rate_limited","suspended","paused"],webhooks:["succeeded","duplicate","failed"],tasks:["running","succeeded","failed"],audit:["succeeded","failed"],cases:["open","processing","resolved"],
};
export const labels: Record<string,string> = {
  id:"编号",email:"邮箱",name:"姓名",user_id:"用户 ID",owner_id:"使用身份",created_at:"创建时间",last_login_at:"登录时间",historical:"历史账户",status:"状态",ban_reason:"封禁原因",credits:"可用积分",payments:"交易数",descriptions:"成功图片数",plan:"套餐",offer_id:"购买商品",environment:"支付环境",amount_cents:"订单金额",currency:"币种",credit_amount:"购买时的积分权益",confirmed_at:"确认时间",checkout_id:"结账编号",customer_id:"渠道客户编号",subscription_id:"订阅编号",order_id:"订单编号",amount_paid:"实收金额",refunded_amount:"累计退款",paid_at:"支付事件时间",period_start:"付费周期开始",period_end:"付费周期结束",provider_status:"渠道状态",evidence_at:"凭证核验时间",issued_credits:"关联发放总积分",unspent_credits:"关联未用积分（含未来窗口）",paid_through:"付费有效期",last_event_at:"渠道事件时间戳",has_access:"Pro 权益",amount:"发放积分",remaining:"剩余积分",starts_at:"生效时间",expires_at:"到期时间",payment_id:"交易编号",revoked:"已撤销",spendable:"可用批次",grant_id:"积分批次",reference_id:"关联编号",delta:"积分变动",source:"积分来源",request_id:"客户端请求编号",units:"图片数量",batch:"批量模式",credits_per_image:"每张图片积分",recoverable:"满足恢复条件",client_request_id:"客户端请求编号",reservation_id:"预占编号",language:"语言",model:"模型",stage:"故障 / 处理阶段",error_code:"错误码",moderation:"审核摘要",completed_at:"结束时间",duration_ms:"耗时",reservation_status:"积分结算",event_id:"渠道事件编号",event_type:"事件类型",attempts:"投递尝试数",finished_at:"结束时间",processed:"恢复数量",actor_id:"操作者",action:"操作",target:"操作对象",reason:"原因",summary:"变更摘要",case_status:"异常处理状态",note:"处理记录",source_type:"异常类型",source_id:"异常来源编号",
};

export const text = (value: unknown) => value == null || value === "" ? "—" : String(value);
export const word = (value: unknown) => words[text(value)] ?? text(value);
const timestamp = (value: unknown) => new Date(typeof value === "number" ? value : String(value)).getTime();
export const date = (value: unknown) => value && Number.isFinite(timestamp(value)) ? new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(timestamp(value)) : "—";
export const fullDate = (value: unknown) => value && Number.isFinite(timestamp(value)) ? new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(timestamp(value)) : "—";
export const number = (value: unknown) => value == null ? "—" : Number(value).toLocaleString("zh-CN");
export const money = (value: unknown, currency = "USD") => value == null ? "—" : new Intl.NumberFormat("zh-CN",{style:"currency",currency}).format(Number(value)/100);
export function cell(key: string, value: unknown, row: Row, full = false): string {
  if (key === "email" && !value) return text(row.user_id ?? row.owner_id ?? row.id);
  if (["amount_cents","amount_paid","refunded_amount"].includes(key)) return money(value, String(row.currency || "USD"));
  if (key === "duration_ms") return value == null ? "—" : `${(Number(value)/1000).toFixed(1)} 秒`;
  if (key === "last_event_at") return Number(value)>0 ? fullDate(Number(value)<1e12?Number(value)*1000:Number(value)) : "—";
  if (key.endsWith("_at") || ["paid_through","period_start","period_end"].includes(key)) return full ? fullDate(value) : date(value);
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "number") return key === "delta" && value > 0 ? `+${number(value)}` : number(value);
  return word(value);
}

export function recordLocation(resource: string, id: string, environment?: string) {
  const section = resource === "orders" || resource === "payments" || resource === "subscriptions" ? "billing" : ["grants","ledger","reservations"].includes(resource) ? "credits" : ["webhooks","tasks","cases"].includes(resource) ? "operations" : resource;
  const params = new URLSearchParams({ tab: resource, id });
  if (environment) params.set("environment", environment);
  return `/admin/${section}?${params}`;
}
