"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { date, fullDate, money, number, recordLocation, text, type Row } from "./model";
import type { ActionDraft } from "./AdminActionDialog";
export type OverviewData = { metrics: Row; trend: Row[]; queue: Row[]; from: string; to: string; environment: string; capturedAt: string };

export function Queue({ rows, onAction }: { rows: Row[]; onAction: (draft: ActionDraft) => void }) {
  const resource: Record<string, string> = { reservation: "reservations", order: "orders", webhook: "webhooks", task: "tasks", request: "requests" };
  return <div className="admin-queue">{rows.length ? <ul>{rows.map(row => <li key={`${row.source_type}:${row.source_id}`}><CircleAlert size={16} aria-hidden="true" /><div><Link href={recordLocation(resource[text(row.source_type)], text(row.source_id))}>{text(row.label)}</Link><small className="admin-id" title={text(row.source_id)}>{text(row.source_id)}</small></div><div><span className="admin-muted">{date(row.created_at)}</span><button onClick={() => onAction({ action: "case", sourceType: text(row.source_type), target: text(row.source_id), label: text(row.label) })}>{row.case_status === "processing" ? "跟进" : "处理"}<ArrowRight size={14} aria-hidden="true" /></button></div></li>)}</ul> : <p className="admin-empty"><CheckCircle2 size={16} aria-hidden="true" />没有待处理异常。</p>}</div>;
}

type TrendBucket = { day: string; endDay: string; images: number | null; partial: boolean };

function chartHistory(rows: Row[]) {
  const period = rows.length > 90 ? "month" : rows.length > 31 ? "week" : "day";
  const groups = new Map<string, TrendBucket>();
  rows.forEach((row, index) => {
    const day = text(row.day);
    const key = period === "month" ? day.slice(0, 7) : period === "week" ? String(Math.floor(index / 7)) : day;
    const bucket = groups.get(key) ?? { day, endDay: day, images: null, partial: false };
    bucket.endDay = day;
    if (row.images == null) bucket.partial = true;
    else bucket.images = (bucket.images ?? 0) + Number(row.images);
    groups.set(key, bucket);
  });
  return { buckets: [...groups.values()], period };
}

function GenerationTrend({ data }: { data: OverviewData }) {
  const [active, setActive] = useState<number | null>(null);
  const { buckets, period } = chartHistory(data.trend);
  const peak = Math.max(1, ...buckets.map(row => Number(row.images)));
  const magnitude = 10 ** Math.floor(Math.log10((peak + 1) / 3));
  const step = Math.max(1, Math.ceil((peak + 1) / 3 / magnitude) * magnitude);
  const ceiling = step * 3;
  const selected = active == null ? null : buckets[active];
  const labelStep = Math.max(1, Math.ceil((buckets.length - 1) / 6));
  const periodLabel = period === "month" ? "按月汇总" : period === "week" ? "每 7 天汇总" : "成功图片";
  const rangeDate = (value: string) => new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit" }).format(new Date(value));
  const bucketLabel = (row: TrendBucket) => `${row.day}${row.endDay !== row.day ? ` 至 ${row.endDay}` : ""}`;
  return <section className="admin-panel admin-trend"><div className="admin-section-heading"><h2>图片生成趋势</h2><Link href="/admin/requests">生成请求 <ArrowRight size={14} aria-hidden="true" /></Link></div><div className="admin-chart-caption"><span>{rangeDate(data.from)} — {rangeDate(new Date(Date.parse(data.to) - 1).toISOString())}</span><span>{periodLabel} · 张</span></div>
    <div className="admin-chart" aria-label={`${periodLabel}数量`}><div className="admin-chart-axis" aria-hidden="true">{[3, 2, 1, 0].map(tick => <span key={tick}>{number(step * tick)}</span>)}</div><div className="admin-chart-plot"><div className="admin-chart-grid" aria-hidden="true">{[0, 1, 2, 3].map(tick => <span key={tick} />)}</div><div className="admin-chart-bars">{buckets.map((row, index) => <button className="admin-chart-column" key={row.day} data-value={row.images ?? undefined} aria-label={`${bucketLabel(row)}：${row.images == null ? "未采集" : `${number(row.images)} 张成功图片${row.partial ? "，含未采集日期" : ""}`}`} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(index)} data-active={active === index}><span className="admin-chart-track">{row.images == null ? <span className="admin-chart-missing">—</span> : <span className="admin-chart-bar" style={{ height: `${Number(row.images) / ceiling * 100}%` }} />}{Number(row.images) > 0 && <span className="admin-chart-value" style={{ bottom: `${Number(row.images) / ceiling * 100}%` }}>{number(row.images)}</span>}</span><span className="admin-chart-label">{index % labelStep === 0 ? period === "month" ? row.day.slice(2, 7) : row.day.slice(5) : ""}</span></button>)}</div></div></div>
    <p className="admin-chart-footnote" aria-live="polite">{selected ? <><strong>{bucketLabel(selected)}</strong> · {selected.images == null ? "请求元数据未采集" : `${number(selected.images)} 张成功图片${selected.partial ? "，含未采集日期" : ""}`}</> : data.metrics.tracking_since ? `采集起始 ${fullDate(data.metrics.tracking_since)}` : "请求元数据未采集，历史记录见积分管理。"}</p>
  </section>;
}

export function AdminOverview({ data, onAction }: { data: OverviewData; onAction: (draft: ActionDraft) => void }) {
  const m = data.metrics;
  const rate = (count: unknown) => Number(m.reserved_requests) > 0 ? `${(Number(count) / Number(m.reserved_requests) * 100).toFixed(1)}%` : "—";
  const metrics = [
    { label: "成功生成图片", value: number(m.images), unit: "张", note: "按完成时间", href: "/admin/requests?status=succeeded" },
    { label: "新增用户", value: number(m.new_users), unit: "人", note: "不含历史迁入", href: "/admin/users" },
    { label: "积分净消耗", value: number(m.credits_consumed), unit: "积分", note: "预占减退回", href: "/admin/credits?tab=ledger" },
  ];
  return <div className="admin-overview">
    <div className="admin-attention" data-quiet={!data.queue.length}><div>{data.queue.length ? <CircleAlert size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}<span>{data.queue.length ? <><strong>{data.queue.length === 100 ? "100+" : data.queue.length} 项异常待办</strong><span className="admin-attention-detail">需要核验支付回调、请求或积分结算</span></> : <strong>没有待处理异常</strong>}</span></div><Link href="/admin/operations?tab=queue">{data.queue.length ? "前往处理" : "查看待办"}<ArrowRight size={14} aria-hidden="true" /></Link></div>
    <div className="admin-metrics">{metrics.map(({ label, value, unit, note, href }) => <Link href={href} key={label}><span>{label}<ArrowRight size={14} aria-hidden="true" /></span><div><strong>{value}</strong><span className="admin-metric-unit">{unit}</span></div><small>{note}</small></Link>)}</div>
    <div className="admin-overview-grid"><GenerationTrend data={data} /><section className="admin-panel admin-revenue"><div className="admin-section-heading"><h2>交易与退款</h2><span className="admin-muted">USD</span></div><p className="admin-revenue-label">成交净额</p><strong className="admin-revenue-total">{money(Number(m.gross_cents) - Number(m.refund_cents))}</strong><dl><div><dt>核验成交额</dt><dd>{money(m.gross_cents)}</dd></div><div><dt>退款金额</dt><dd>{money(m.refund_cents)}</dd></div><div><dt>付费交易</dt><dd>{number(m.payments)} <span>笔</span></dd></div></dl><p className="admin-muted">{Number(m.unknown_payments) > 0 ? `${number(m.unknown_payments)} 笔金额或时间缺失，未计入合计。` : "渠道凭证口径 · 未扣税费与手续费"}</p><Link className="admin-panel-link" href="/admin/billing?tab=payments">核对交易 <ArrowRight size={14} aria-hidden="true" /></Link></section></div>
    <div className="admin-overview-bottom"><section className="admin-panel admin-queue-panel"><div className="admin-section-heading"><h2>异常待办 <span className="admin-count">{data.queue.length === 100 ? "100+" : data.queue.length}</span></h2><Link href="/admin/operations?tab=queue">查看待办 <ArrowRight size={14} aria-hidden="true" /></Link></div><Queue rows={data.queue.slice(0, 3)} onAction={onAction} /></section><section className="admin-panel"><div className="admin-section-heading"><h2>生成与审核</h2><Link href="/admin/requests">请求 <ArrowRight size={14} aria-hidden="true" /></Link></div><dl className="admin-quality"><div><dt>生成成功率</dt><dd>{rate(m.successful_requests)}</dd></div><div><dt>技术失败率</dt><dd>{rate(m.technical_failures)}</dd></div><div><dt>内容拦截 / 处理中</dt><dd>{number(m.blocked)} / {number(m.processing)}</dd></div></dl><p className="admin-muted">{number(m.reserved_requests)} 个预占请求，含待结算</p></section><section className="admin-panel"><div className="admin-section-heading"><h2>用户与权益</h2><Link href="/admin/users">用户 <ArrowRight size={14} aria-hidden="true" /></Link></div><dl className="admin-quality"><div><dt>活跃生成用户</dt><dd>{number(m.active_users)} <span>人</span></dd></div><div><dt>活跃访客身份</dt><dd>{number(m.active_guests)} <span>个</span></dd></div><div><dt>有效 Pro 用户</dt><dd>{number(m.pro_users)} <span>人</span></dd></div></dl><p className="admin-muted">Pro 权益按查询时的快照统计</p></section></div>
    <p className="admin-overview-source">请求与权益来自业务记录 · 支付范围：{data.environment === "live" ? "生产" : "测试"}<span>采集时间 {fullDate(data.capturedAt)}</span></p>
  </div>;
}
