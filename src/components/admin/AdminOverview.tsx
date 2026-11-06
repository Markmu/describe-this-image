"use client";
import Link from "next/link";
import { date, fullDate, money, number, recordLocation, text, type Row } from "./model";
import type { ActionDraft } from "./AdminActionDialog";
export type OverviewData={metrics:Row;trend:Row[];queue:Row[];from:string;to:string;environment:string;capturedAt:string};

export function Queue({ rows,onAction }: {rows:Row[];onAction:(draft:ActionDraft)=>void}) {
  const resource:Record<string,string>={reservation:"reservations",order:"orders",webhook:"webhooks",task:"tasks",request:"requests"};
  return <div className="admin-queue">{rows.length?<ul>{rows.map(row=><li key={`${row.source_type}:${row.source_id}`}><div><Link href={recordLocation(resource[text(row.source_type)],text(row.source_id))}>{text(row.label)}</Link><small className="admin-id">{text(row.source_id)}</small></div><div><span className="admin-muted">{date(row.created_at)}</span><button onClick={()=>onAction({action:"case",sourceType:text(row.source_type),target:text(row.source_id),label:text(row.label)})}>{row.case_status==="processing"?"跟进":"处理"}</button></div></li>)}</ul>:<p className="admin-empty">没有待处理异常。</p>}</div>;
}

export function AdminOverview({ data,onAction }: {data:OverviewData;onAction:(draft:ActionDraft)=>void}) {
  const m=data.metrics;
  const peak=Math.max(1,...data.trend.map(row=>Number(row.images)));
  const rate=(count:unknown)=>Number(m.reserved_requests)>0?`${(Number(count)/Number(m.reserved_requests)*100).toFixed(1)}%`:"—";
  const metrics=[["成功生成图片",number(m.images),"按完成时间统计"],["新增用户",number(m.new_users),"历史迁入账户另列"],["活跃生成用户",number(m.active_users),`另有 ${number(m.active_guests)} 个访客身份`],["付费交易",number(m.payments),"包含订阅续费"],["有效 Pro 用户",number(m.pro_users),"查询时的权益快照"],["积分净消耗",number(m.credits_consumed),"预占减退回"]];
  return <>
    <div className="admin-metrics">{metrics.map(([label,value,note])=><div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <div className="admin-overview-grid"><section className="admin-panel admin-trend"><div className="admin-section-heading"><h2>图片生成趋势</h2><Link href="/admin/requests">查看请求 →</Link></div><p className="admin-muted">{fullDate(data.from)} — {fullDate(new Date(Date.parse(data.to)-1).toISOString())}</p>
      <div className="admin-chart" role="img" aria-label={`所选区间成功生成 ${number(m.images)} 张图片，采集前的日期标为缺失`}>{data.trend.map((row,index)=><div className="admin-chart-column" key={text(row.day)} title={row.images==null?`${row.day}：未采集`:`${row.day}：${row.images} 张`}><span className="admin-chart-value">{row.images==null?"—":Number(row.images)>0?number(row.images):""}</span><div className="admin-chart-track"><div className="admin-chart-bar" style={{height:`${Number(row.images)/peak*100}%`}} /></div><span className="admin-chart-label">{data.trend.length<=7||index===0||index===data.trend.length-1||index%7===0?text(row.day).slice(5):""}</span></div>)}</div>
      <p className="admin-muted">{m.tracking_since?`请求采集起始：${fullDate(m.tracking_since)}`:"请求元数据未采集。历史使用记录见积分管理。"}</p>
    </section><section className="admin-panel admin-revenue"><h2>交易与退款</h2><dl><div><dt>已核验成交额</dt><dd>{money(m.gross_cents)}</dd></div><div><dt>退款额</dt><dd>{money(m.refund_cents)}</dd></div><div><dt>成交净额</dt><dd>{money(Number(m.gross_cents)-Number(m.refund_cents))}</dd></div></dl><p className="admin-muted">USD · 成交净额未扣手续费与税费。</p><p className="admin-muted">{Number(m.unknown_payments)>0?`${number(m.unknown_payments)} 笔交易缺少金额或支付时间，未计入金额合计。`:"金额合计来自渠道交易凭证。"}</p><Link href="/admin/billing?tab=payments">核对交易 →</Link></section></div>
    <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-section-heading"><h2>异常待办 <span className="admin-count">{data.queue.length===100?"100+":data.queue.length}</span></h2><Link href="/admin/operations?tab=queue">查看待办 →</Link></div><Queue rows={data.queue.slice(0,4)} onAction={onAction}/></section>
      <section className="admin-panel"><h2>生成与审核</h2><dl className="admin-quality"><div><dt>生成成功率</dt><dd>{rate(m.successful_requests)}</dd></div><div><dt>技术失败率</dt><dd>{rate(m.technical_failures)}</dd></div><div><dt>内容拦截</dt><dd>{number(m.blocked)}</dd></div><div><dt>处理中</dt><dd>{number(m.processing)}</dd></div></dl><p className="admin-muted">分母为区间内获得预占的 {number(m.reserved_requests)} 个请求，含待结算；每个请求处理一张图片。</p></section></div>
  </>;
}
