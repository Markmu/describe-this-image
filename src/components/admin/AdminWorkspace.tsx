"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { AdminActionDialog, type ActionDraft } from "./AdminActionDialog";
import { AdminDetail } from "./AdminDetail";
import { AdminTable } from "./AdminTable";
import { AdminOverview, Queue, type OverviewData } from "./AdminOverview";
import { AdminOperations, type OperationsData } from "./AdminOperations";
import { sections, statuses, word, type ListData, type Row } from "./model";
import { useAdminData } from "./useAdminData";

export function AdminWorkspace({section}:{section:string}) {
  const router=useRouter();const pathname=usePathname();const params=useSearchParams();
  const config=sections[section];
  const [revision,setRevision]=useState(0);const [draft,setDraft]=useState<ActionDraft|null>(null);const [notice,setNotice]=useState("");
  const requested=params.get("tab");const tab=config.tabs.some(([key])=>key===requested)?requested!:config.tabs[0]?.[0];
  const resource=section==="overview"?"overview":tab==="settings"?"operations":tab;
  const requestParams=new URLSearchParams(params.toString());requestParams.delete("id");requestParams.delete("tab");
  const {data,error,loading}=useAdminData<ListData|OverviewData|OperationsData|Row[]>(`/api/admin/${resource}?${requestParams}`,revision);
  const environment=params.get("environment")||((data&&!Array.isArray(data)&&"environment"in data)?String(data.environment):"test");
  const detailId=params.get("id");
  const navigate=(next:URLSearchParams)=>router.replace(`${pathname}${next.size?`?${next}`:""}`,{scroll:false});
  const changeTab=(nextTab:string)=>{const next=new URLSearchParams(params.toString());next.set("tab",nextTab);next.delete("id");next.delete("cursor");next.delete("status");navigate(next);};
  const refresh=()=>{setRevision(n=>n+1);};
  const isList=resource!=="overview"&&resource!=="operations"&&resource!=="queue";
  const filters=(<form className="admin-filters" key={params.toString()} onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);const next=new URLSearchParams();if(tab)next.set("tab",tab);for(const[key,value]of form.entries())if(String(value))next.set(key,String(value));navigate(next);}}>
    {isList&&<><label className="admin-search"><Search size={16} aria-hidden="true"/><span className="sr-only">搜索邮箱或业务编号</span><input name="q" defaultValue={params.get("q")??""} placeholder="搜索邮箱或业务编号" maxLength={256}/></label><label><span className="sr-only">状态筛选</span><select name="status" defaultValue={params.get("status")??""}><option value="">全部状态</option>{(statuses[resource]??[]).map(status=><option value={status} key={status}>{word(status)}</option>)}</select></label></>}
    {section==="users"&&<label><span className="sr-only">订阅筛选</span><select name="plan" defaultValue={params.get("plan")??""}><option value="">全部订阅</option><option value="free">无 Pro 订阅</option><option value="pro-month">Pro 月付</option><option value="pro-year">Pro 年付</option></select></label>}
    {section==="overview"&&<label><span className="sr-only">统计区间</span><select name="days" defaultValue={params.get("days")??"7"}><option value="7">近 7 天</option><option value="30">近 30 天</option></select></label>}
    {["overview","billing"].includes(section)&&<label><span className="sr-only">支付环境</span><select name="environment" defaultValue={params.get("environment")??""}><option value="">部署环境</option><option value="test">测试支付</option><option value="live">生产支付</option></select></label>}
    {(isList||section==="overview")&&<><details className="admin-date-filter"><summary>日期筛选</summary><div><label>开始日期<input type="date" name="from" defaultValue={params.get("from")??""}/></label><label>结束日期<input type="date" name="to" defaultValue={params.get("to")??""}/></label><small>UTC+8 · 含结束日</small></div></details>{params.get("user")&&<input type="hidden" name="user" value={params.get("user")!}/>}<button type="submit">应用筛选</button>{(params.get("q")||params.get("status")||params.get("from")||params.get("user"))&&<Link href={`${pathname}${tab?`?tab=${tab}`:""}`} className="admin-reset">清除筛选</Link>}</>}
  </form>);
  return <>
    <header className="admin-page-heading"><div><h1>{config.title}</h1><p>{config.description}</p></div><button onClick={refresh} className="admin-refresh" disabled={loading}><RefreshCw size={15} aria-hidden="true"/>刷新</button></header>
    {notice&&<div role="status" className="admin-notice">{notice}<button aria-label="关闭通知" onClick={()=>setNotice("")}>×</button></div>}
    {config.tabs.length>1&&<div className="admin-tabs" role="tablist" aria-label={`${config.title}分类`}>{config.tabs.map(([key,label])=><button key={key} role="tab" aria-selected={key===tab} onClick={()=>changeTab(key)}>{label}</button>)}</div>}
    {(isList||section==="overview")&&filters}
    {params.get("user")&&<p className="admin-filter-context">关联用户：<Link href={`/admin/users?id=${encodeURIComponent(params.get("user")!)}`}>{params.get("user")}</Link></p>}
    {loading&&<div className="admin-loading" role="status"><p>读取{config.title}…</p><div className="admin-skeleton"/><div className="admin-skeleton"/><div className="admin-skeleton"/></div>}
    {error&&<div className="admin-error" role="alert"><h2>数据读取失败</h2><p>{error}</p><button onClick={refresh}>重试</button></div>}
    {data&&!error&&!loading&&(section==="overview"?<AdminOverview data={data as OverviewData} onAction={setDraft}/>:resource==="operations"?<AdminOperations key={revision} data={data as OperationsData} onAction={setDraft}/>:resource==="queue"?<section className="admin-panel"><h2>异常待办</h2><p className="admin-muted">超过五分钟的积分预占、支付回调失败与服务故障。</p><Queue rows={data as Row[]} onAction={setDraft}/></section>:<>
      {resource==="payments"&&<p className="admin-list-note">历史交易金额缺失时展示“—”；退款与取消订阅通过 Creem 管理端处理。</p>}
      {resource==="grants"&&<p className="admin-list-note">购买权益与未来订阅窗口按批次展示。补偿入口位于用户详情。</p>}
      {resource==="requests"&&<p className="admin-list-note">生成结果与积分结算分栏展示。历史未采集的请求可在使用记录中查询。</p>}
      {(data as ListData).items.length?<AdminTable resource={resource} rows={(data as ListData).items} onDetail={id=>{const next=new URLSearchParams(params.toString());next.set("id",id);navigate(next);}}/>:<div className="admin-empty-state"><h2>没有匹配记录</h2><p>调整日期、状态或搜索条件。新产生的业务记录将在此展示。</p>{section==="users"&&<p>用户档案在 Google 登录时创建，历史账户由迁移补录。</p>}</div>}
      <div className="admin-pagination"><span className="admin-muted">本页 {(data as ListData).items.length} 条 · 每页 25 条</span><div>{params.has("cursor")&&<button onClick={()=>{const next=new URLSearchParams(params.toString());next.delete("cursor");navigate(next);}}>返回首页</button>}{(data as ListData).nextCursor&&<button onClick={()=>{const next=new URLSearchParams(params.toString());next.set("cursor",(data as ListData).nextCursor!);navigate(next);}}>下一页 →</button>}</div></div>
    </>)}
    {detailId&&isList&&<AdminDetail key={`${resource}:${detailId}`} resource={resource} id={detailId} environment={environment} revision={revision} onClose={()=>{const next=new URLSearchParams(params.toString());next.delete("id");navigate(next);}} onAction={setDraft}/>}
    {draft&&<AdminActionDialog draft={draft} onClose={()=>setDraft(null)} onSuccess={()=>{setNotice(`${word(draft.action)}已完成，操作记录已写入审计日志。`);refresh();}}/>}
  </>;
}
