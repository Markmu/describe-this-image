"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { AdminTabs } from "./AdminTabs";
import { useAdminData } from "./useAdminData";
import { cell, fullDate, labels, recordLocation, text, word, type ListData, type Row } from "./model";
import type { ActionDraft } from "./AdminActionDialog";

function UserRelated({ id, environment, revision }: { id:string;environment:string;revision:number }) {
  const [tab,setTab]=useState("grants");
  const paths:Record<string,string>={grants:"credits",orders:"billing",subscriptions:"billing",requests:"requests",audit:"audit"};
  const params = new URLSearchParams(tab==="audit"?{q:id,environment}:{user:id,environment});
  const {data,error,loading}=useAdminData<ListData>(`/api/admin/${tab}?${params}`,revision);
  return <section className="admin-related"><h3>关联记录</h3><AdminTabs tabs={[["grants","积分批次"],["orders","订单"],["subscriptions","订阅"],["requests","生成"],["audit","操作记录"]]} value={tab} label="用户关联记录" panelId="admin-related-results" onChange={setTab}/><div id="admin-related-results" role="tabpanel" aria-labelledby={`admin-related-results-${tab}`}>
    {loading?<p role="status">加载关联记录…</p>:error?<p role="alert">{error}</p>:!data?.items.length?<p className="admin-empty">该用户没有此类记录。</p>:<ul>{data.items.slice(0,5).map(row=><li key={text(row.id)}><Link href={recordLocation(tab,text(row.id),environment)}>{text(row.id)}</Link><span>{word(row.status)}</span><span>{tab==="grants"?`${text(row.remaining)} / ${text(row.amount)} 积分`:fullDate(row.created_at)}</span></li>)}</ul>}
    <Link className="admin-text-link" href={`/admin/${paths[tab]}?tab=${tab}&${params}`}>查看关联列表 →</Link></div>
  </section>;
}

function Summary({ value }: {value:unknown}) {
  if(!value || typeof value!=="object")return <span>{text(value)}</span>;
  return <dl className="admin-summary">{Object.entries(value as Row).map(([key,item])=><div key={key}><dt>{({before:"变更前",after:"变更后",credits:"积分",expiresAt:"到期时间",reference:"关联编号",pause_generation:"暂停生成",pause_checkout:"暂停结账",grantId:"积分批次",reservationId:"预占编号",status:"结果",service:"服务"} as Record<string,string>)[key]??key}</dt><dd>{typeof item==="object"&&item!==null?<Summary value={item}/>:typeof item==="boolean"?(item?"是":"否"):word(item)}</dd></div>)}</dl>;
}

export function AdminDetail({ resource,id,environment,revision,onClose,onAction }: {resource:string;id:string;environment:string;revision:number;onClose:()=>void;onAction:(draft:ActionDraft)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  const {data:row,error,loading}=useAdminData<Row>(`/api/admin/${resource}?${new URLSearchParams({id,environment})}`,revision);
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  const label=row?text(row.email??row.id):id;
  const title=({users:"用户详情",orders:"订单详情",payments:"交易详情",subscriptions:"订阅详情",grants:"积分批次",ledger:"积分流水",reservations:"使用与结算",requests:"生成请求",webhooks:"回调尝试",tasks:"恢复任务",audit:"管理员操作",cases:"异常处理"} as Record<string,string>)[resource]??"记录详情";
  const sourceType = row?String(row.kind):"";
  const relatedUser=String(row?.user_id??"");
  const fields=Object.entries(row??{}).filter(([key])=>labels[key]&&!['stages','summary','cursor_at','user_id'].includes(key));
  return <dialog ref={dialog} className="admin-dialog admin-detail-dialog" aria-labelledby="admin-detail-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget&&event.clientX<event.currentTarget.getBoundingClientRect().left)onClose();}}>
    <div className="admin-dialog-heading"><h2 id="admin-detail-title">{title}</h2><button onClick={onClose} aria-label="关闭详情"><X size={19}/></button></div>
    <div className="admin-detail-identity"><p className="admin-id">{id}</p><button aria-label="复制编号" onClick={async()=>{try{await navigator.clipboard.writeText(id);setCopied(true);setCopyError(false);}catch{setCopied(false);setCopyError(true);}}}>{copied?<Check size={14} aria-hidden="true"/>:<Copy size={14} aria-hidden="true"/>}<span role="status">{copied?"复制完成":"复制编号"}</span></button></div>
    {copyError&&<p role="status" className="admin-error-text">复制失败，请选中编号复制。</p>}
    {loading?<p role="status">加载记录…</p>:error?<p className="admin-error-text" role="alert">{error}</p>:row&&<>
      <div className="admin-detail-actions">
        {resource==="users"&&<><button onClick={()=>onAction({action:"compensate",target:id,label})}>补偿积分</button><button onClick={()=>onAction({action:row.status==="banned"?"unban":"ban",target:id,label})}>{row.status==="banned"?"解封用户":"封禁用户"}</button></>}
        {resource==="reservations"&&row.recoverable===true&&<button onClick={()=>onAction({action:"recover",target:id,label:"退回该异常预占"})}>退回积分</button>}
        {["order","webhook","request","reservation","task"].includes(sourceType)&&<button onClick={()=>onAction({action:"case",sourceType,target:id,label:`${word(sourceType)} · ${id}`})}>记录处理</button>}
        {resource==="cases"&&<button onClick={()=>onAction({action:"case",sourceType:text(row.source_type),target:text(row.source_id),label:"更新异常处理记录"})}>更新处理记录</button>}
        {["orders","payments","subscriptions"].includes(resource)&&<a href="https://www.creem.io/dashboard" target="_blank" rel="noreferrer">打开 Creem ↗</a>}
        {relatedUser&&resource!=="users"&&resource!=="audit"&&<Link href={recordLocation("users",relatedUser,environment)}>查看用户 →</Link>}
      </div>
      <dl className="admin-detail-fields">{fields.map(([key,value])=><div key={key}><dt>{labels[key]}</dt><dd>{cell(key,value,row,true)}</dd></div>)}</dl>
      {resource==="requests"&&<section className="admin-timeline"><h3>处理阶段</h3>{Array.isArray(row.stages)?<ol>{(row.stages as Row[]).map((event,index)=><li key={index}><span>{word(event.stage)}</span><time>{fullDate(event.at)}</time></li>)}</ol>:<p>阶段记录未采集。</p>}<p className="admin-muted">图片与描述正文不进入运营记录。</p>
        {Boolean(row.reservation_id)&&<Link href={recordLocation("reservations",text(row.reservation_id),environment)}>查看积分预占与结算 →</Link>}
      </section>}
      {row.summary!=null&&<section><h3>变更摘要</h3><Summary value={row.summary}/></section>}
      {resource==="users"&&<UserRelated id={id} environment={environment} revision={revision}/>}
      {resource==="orders"&&<div className="admin-related-links"><Link href={`/admin/billing?tab=payments&q=${encodeURIComponent(id)}&environment=${environment}`}>关联交易 →</Link><Link href={`/admin/credits?tab=grants&user=${encodeURIComponent(relatedUser)}`}>用户积分批次 →</Link></div>}
      {resource==="payments"&&<div className="admin-related-links"><Link href={recordLocation("orders",text(row.order_id),environment)}>关联订单 →</Link><Link href={`/admin/credits?tab=grants&q=${encodeURIComponent(id)}`}>关联积分批次 →</Link></div>}
      {resource==="webhooks"&&Boolean(row.order_id)&&<Link href={recordLocation("orders",text(row.order_id),environment)}>关联订单 →</Link>}
      {resource==="ledger"&&<Link href={recordLocation("grants",text(row.grant_id),environment)}>查看来源积分批次 →</Link>}
      {resource==="grants"&&Boolean(row.payment_id)&&<Link href={recordLocation("payments",text(row.payment_id),environment)}>查看支付交易 →</Link>}
      {resource==="subscriptions"&&<Link href={`/admin/credits?tab=grants&status=subscription&user=${encodeURIComponent(relatedUser)}`}>查看月度积分窗口 →</Link>}
    </>}
  </dialog>;
}
