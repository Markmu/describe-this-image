"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, ListFilter, RefreshCw, Search, SearchX, X } from "lucide-react";
import { AdminActionDialog, type ActionDraft } from "./AdminActionDialog";
import { AdminDetail } from "./AdminDetail";
import { AdminTable } from "./AdminTable";
import { AdminTabs } from "./AdminTabs";
import { AdminSelect } from "./AdminSelect";
import { AdminOverview, Queue, type OverviewData } from "./AdminOverview";
import { AdminOperations, type OperationsData } from "./AdminOperations";
import { sections, statuses, word, type ListData, type Row } from "./model";
import { useAdminData } from "./useAdminData";

const filterLabels: Record<string, string> = { q: "搜索", status: "状态", plan: "订阅", from: "起始", to: "结束", user: "用户", environment: "支付" };
const listNotes: Record<string, string> = {
  payments: "金额缺失以 — 标记。退款与取消订阅通过 Creem 处理。",
  grants: "购买权益与订阅窗口按批次展示。补偿入口位于用户详情。",
  requests: "生成结果与积分结算分栏展示，历史使用记录见积分管理。",
};

export function AdminWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const config = sections[section];
  const search = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [notice, setNotice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [navigating, startTransition] = useTransition();
  const requested = params.get("tab");
  const tab = config.tabs.some(([key]) => key === requested) ? requested! : config.tabs[0]?.[0];
  const resource = section === "overview" ? "overview" : tab === "settings" ? "operations" : tab;
  const requestParams = new URLSearchParams(params.toString());
  requestParams.delete("id");
  requestParams.delete("tab");
  const { data, error, loading, updatedAt } = useAdminData<ListData | OverviewData | OperationsData | Row[]>(`/api/admin/${resource}?${requestParams}`, revision);
  const busy = loading || navigating;
  const environment = params.get("environment") || ((data && !Array.isArray(data) && "environment" in data) ? String(data.environment) : "test");
  const detailId = params.get("id");
  const isList = resource !== "overview" && resource !== "operations" && resource !== "queue";
  const activeFilters = [...params.entries()].filter(([key, value]) => filterLabels[key] && value);
  const navigate = (next: URLSearchParams) => startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  const refresh = () => setRevision(n => n + 1);
  const clearFilters = () => { const next = new URLSearchParams(); if (tab) next.set("tab", tab); navigate(next); };
  const changeTab = (nextTab: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", nextTab);
    ["id", "cursor", "status"].forEach(key => next.delete(key));
    navigate(next);
  };

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.defaultPrevented || event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || target.closest('input, textarea, select, [role="combobox"], [contenteditable="true"]') || document.querySelector("dialog[open]")) return;
      if (search.current) { event.preventDefault(); search.current.focus(); }
    };
    const closeDate = (event: Event) => {
      const node = document.querySelector<HTMLDetailsElement>(".admin-date-filter[open]");
      if (!node) return;
      if (event instanceof KeyboardEvent && event.key === "Escape") { node.open = false; node.querySelector("summary")?.focus(); }
      else if (event.type === "pointerdown" && !node.contains(event.target as Node)) node.open = false;
    };
    window.addEventListener("keydown", focusSearch);
    window.addEventListener("keydown", closeDate);
    window.addEventListener("pointerdown", closeDate);
    return () => { window.removeEventListener("keydown", focusSearch); window.removeEventListener("keydown", closeDate); window.removeEventListener("pointerdown", closeDate); };
  }, []);

  return <>
    <header className="admin-page-heading"><div><h1>{config.title}</h1><p>{config.description}</p></div><div className="admin-freshness"><span role="status">{busy ? "更新中…" : updatedAt ? `${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(updatedAt))} 更新` : "等待数据"}</span><button onClick={refresh} className="admin-refresh" disabled={busy} aria-label="刷新数据"><RefreshCw size={15} className={busy ? "admin-spinning" : undefined} aria-hidden="true" /><span>刷新</span></button></div></header>
    {notice && <div role="status" className="admin-notice"><CheckCircle2 size={17} aria-hidden="true" /><span>{notice}</span><button aria-label="关闭通知" onClick={() => setNotice("")}><X size={16} /></button></div>}
    {config.tabs.length > 1 && <AdminTabs tabs={config.tabs} value={tab} label={`${config.title}分类`} panelId="admin-results" onChange={changeTab} />}
    {(isList || section === "overview") && <form className={`admin-filters ${isList ? "admin-list-filters" : "admin-overview-filters"}`} key={`${pathname}:${params}`} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const next = new URLSearchParams();
      if (tab) next.set("tab", tab);
      for (const [key, value] of form.entries()) if (String(value)) next.set(key, String(value));
      navigate(next);
      setFiltersOpen(false);
    }}>
      {isList && <label className="admin-search"><Search size={16} aria-hidden="true" /><span className="sr-only">搜索邮箱或业务编号</span><input ref={search} name="q" defaultValue={params.get("q") ?? ""} placeholder="搜索邮箱、业务编号…" maxLength={256} /><kbd aria-hidden="true">/</kbd></label>}
      {section === "overview" && <AdminSelect name="days" label="统计区间" defaultValue={params.get("from") || params.get("to") ? "custom" : params.get("days") ?? "7"} options={[{value:"custom",label:"自定区间",disabled:true},{value:"7",label:"近 7 天"},{value:"30",label:"近 30 天"}]} onChange={(value, form) => { if (value !== "custom") form?.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach(input => { input.value = ""; }); }} />}
      <button type="button" className="admin-filter-toggle" aria-expanded={filtersOpen} aria-controls="admin-filter-options" onClick={() => setFiltersOpen(!filtersOpen)}><ListFilter size={16} aria-hidden="true" />筛选{activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
      <div id="admin-filter-options" className="admin-filter-options" data-open={filtersOpen}>
        {isList && <div className="admin-filter-field"><span>状态</span><AdminSelect name="status" label="状态筛选" defaultValue={params.get("status") ?? ""} options={[{value:"",label:"全部状态"},...(statuses[resource] ?? []).map(status => ({value:status,label:word(status)}))]} /></div>}
        {section === "users" && <div className="admin-filter-field"><span>订阅</span><AdminSelect name="plan" label="订阅筛选" defaultValue={params.get("plan") ?? ""} options={[{value:"",label:"全部订阅"},{value:"free",label:"无 Pro 订阅"},{value:"pro-month",label:"Pro 月付"},{value:"pro-year",label:"Pro 年付"}]} /></div>}
        {["overview", "billing"].includes(section) && <div className="admin-filter-field"><span>支付环境</span><AdminSelect name="environment" label="支付环境" defaultValue={params.get("environment") ?? ""} options={[{value:"",label:"部署环境"},{value:"test",label:"测试支付"},{value:"live",label:"生产支付"}]} /></div>}
        <details className="admin-date-filter"><summary><span>日期范围</span><ChevronDown className="admin-date-chevron" size={15} strokeWidth={1.6} aria-hidden="true" /></summary><div><label>开始日期<input type="date" name="from" defaultValue={params.get("from") ?? ""} /></label><label>结束日期<input type="date" name="to" defaultValue={params.get("to") ?? ""} /></label><small>UTC+8 · 含结束日</small><button type="submit" className="admin-primary">应用日期</button></div></details>
      </div>
      {params.get("user") && <input type="hidden" name="user" value={params.get("user")!} />}
      <button type="submit" className="admin-apply" aria-label="应用筛选"><span>应用筛选</span><ArrowRight size={15} aria-hidden="true" /></button>
      {section === "overview" && data && "environment" in data && <span className="admin-environment"><span />{environment === "live" ? "生产支付" : "测试支付"}</span>}
    </form>}
    {activeFilters.length > 0 && <div className="admin-active-filters" aria-label="当前筛选">{activeFilters.map(([key, value]) => <button key={key} onClick={() => { const next = new URLSearchParams(params.toString()); next.delete(key); next.delete("cursor"); navigate(next); }} aria-label={`移除${filterLabels[key]}筛选`}><span>{filterLabels[key]}：{key === "environment" ? value === "live" ? "生产" : "测试" : word(value)}</span><X size={12} aria-hidden="true" /></button>)}<button className="admin-clear-filters" onClick={clearFilters}>清除筛选</button></div>}
    <div id="admin-results" role={config.tabs.length > 1 ? "tabpanel" : undefined} aria-labelledby={config.tabs.length > 1 ? `admin-results-${tab}` : undefined} aria-busy={busy}>
      {loading && !data && <div className="admin-loading" role="status"><span className="sr-only">读取{config.title}…</span><div className="admin-skeleton admin-skeleton-heading" /><div className="admin-skeleton" /><div className="admin-skeleton" /><div className="admin-skeleton" /></div>}
      {error && <div className="admin-error" role="alert"><h2>数据读取失败</h2><p>{error}</p>{updatedAt && <p className="admin-muted">以下保留上次读取的数据。</p>}<button onClick={refresh}>重试</button></div>}
      {data && (section === "overview" ? <AdminOverview data={data as OverviewData} onAction={setDraft} /> : resource === "operations" ? <AdminOperations key={updatedAt ?? revision} data={data as OperationsData} onAction={setDraft} /> : resource === "queue" ? <section className="admin-panel"><div className="admin-section-heading"><h2>异常待办</h2><span className="admin-count">{(data as Row[]).length} 项</span></div><p className="admin-muted">超时积分预占、支付回调失败与服务故障。</p><Queue rows={data as Row[]} onAction={setDraft} /></section> : <section className="admin-list-surface" aria-label={`${config.title}记录`}>
        <div className="admin-list-caption"><span>{config.tabs.find(([key]) => key === tab)?.[1]}<span className="admin-result-count">{(data as ListData).items.length} 条{(data as ListData).nextCursor ? " / 本页" : ""}</span></span><span className="admin-muted">按时间排序</span></div>
        {listNotes[resource] && <p className="admin-list-note">{listNotes[resource]}</p>}
        {(data as ListData).items.length ? <AdminTable resource={resource} rows={(data as ListData).items} onDetail={id => { const next = new URLSearchParams(params.toString()); next.set("id", id); navigate(next); }} /> : <div className="admin-empty-state"><SearchX size={25} strokeWidth={1.4} aria-hidden="true" /><h2>{activeFilters.length ? "没有匹配记录" : "等待业务记录"}</h2><p>{activeFilters.length ? "尝试移除筛选，或换用邮箱与业务编号查询。" : "业务发生后，记录将进入此列表。"}</p>{activeFilters.length > 0 && <button onClick={clearFilters}>清除筛选</button>}{section === "users" && <p className="admin-muted">用户档案在 Google 登录时创建。</p>}</div>}
        <div className="admin-pagination"><span className="admin-muted">每页 25 条<span className="admin-pagination-hint"> · 点击记录查看详情</span></span><div>{params.has("cursor") && <button onClick={() => { const next = new URLSearchParams(params.toString()); next.delete("cursor"); navigate(next); }}>返回首页</button>}{(data as ListData).nextCursor && <button onClick={() => { const next = new URLSearchParams(params.toString()); next.set("cursor", (data as ListData).nextCursor!); navigate(next); }}>下一页 <ArrowRight size={14} aria-hidden="true" /></button>}</div></div>
      </section>)}
    </div>
    {detailId && isList && <AdminDetail key={`${resource}:${detailId}`} resource={resource} id={detailId} environment={environment} revision={revision} onClose={() => { const next = new URLSearchParams(params.toString()); next.delete("id"); navigate(next); }} onAction={setDraft} />}
    {draft && <AdminActionDialog draft={draft} onClose={() => setDraft(null)} onSuccess={() => { setNotice(`${word(draft.action)}完成，变更写入操作日志。`); refresh(); }} />}
  </>;
}
