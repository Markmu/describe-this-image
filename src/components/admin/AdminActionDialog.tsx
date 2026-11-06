"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { fullDate, number, word } from "./model";
import { AdminSelect } from "./AdminSelect";

export type ActionDraft = { action:string; target:string; label:string; sourceType?:string; pauseGeneration?:boolean; pauseCheckout?:boolean };
export function AdminActionDialog({ draft, onClose, onSuccess }: { draft: ActionDraft; onClose:()=>void; onSuccess:()=>void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview,setPreview] = useState<Record<string,unknown>|null>(null);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState("");
  const [values,setValues] = useState<Record<string,string>>({});
  const previewTitle = useRef<HTMLHeadingElement>(null);
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  useEffect(()=>{if(preview)previewTitle.current?.focus();},[preview]);
  const previewAction = (form: HTMLFormElement) => {
    const data = new FormData(form);
    setValues(Object.fromEntries([...data.entries()].map(([key,value])=>[key,String(value)])));
    const expires = String(data.get("expiresAt") || "");
    setPreview({operationId:crypto.randomUUID(),action:draft.action,target:draft.target,reason:String(data.get("reason")),
      ...(draft.action==="compensate"?{amount:Number(data.get("amount")),expiresAt:expires?new Date(`${expires}:00+08:00`).toISOString():undefined,reference:String(data.get("reference")||"")}:{}),
      ...(draft.action==="case"?{sourceType:draft.sourceType,status:String(data.get("status"))}:{}),
      ...(draft.action==="settings"?{pauseGeneration:draft.pauseGeneration,pauseCheckout:draft.pauseCheckout}:{})});
  };
  const submit = async () => {
    setPending(true);setError("");
    try {
      const response = await fetch("/api/admin/actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(preview),signal:AbortSignal.timeout(15000)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "操作失败。");
      onSuccess();onClose();
    } catch(error) {setError(error instanceof Error?error.message:"操作失败。");}
    finally {setPending(false);}
  };
  return <dialog ref={dialog} className="admin-dialog admin-action-dialog" aria-labelledby="admin-action-title" onCancel={event=>{if(pending)event.preventDefault();else onClose();}}>
    <div className="admin-dialog-heading"><h2 id="admin-action-title" ref={previewTitle} tabIndex={-1}>{word(draft.action)}</h2><button type="button" onClick={onClose} disabled={pending} aria-label="关闭操作"><X size={19}/></button></div>
    <div className="admin-action-steps" aria-label="操作步骤"><span aria-current={!preview?"step":undefined}>填写变更</span><ArrowRight size={13} aria-hidden="true"/><span aria-current={preview?"step":undefined}>核对并提交</span></div>
    <p className="admin-muted">{draft.label}</p><p className="admin-id">{draft.target}</p>
    {!preview ? <form onSubmit={event=>{event.preventDefault();previewAction(event.currentTarget);}}>
      {draft.action==="compensate"&&<><label>补偿积分<input name="amount" type="number" min="1" max="100000" step="1" required defaultValue={values.amount??"10"} /></label><p className="admin-muted">每张图片消耗 10 积分。</p><label>到期时间（UTC+8，可留空）<input type="datetime-local" name="expiresAt" defaultValue={values.expiresAt}/></label><label>关联订单或请求（可留空）<input name="reference" maxLength={256} defaultValue={values.reference}/></label></>}
      {draft.action==="case"&&<div className="admin-action-field"><span>处理状态</span><AdminSelect name="status" label="处理状态" defaultValue={values.status??"processing"} options={[{value:"open",label:"待处理"},{value:"processing",label:"处理中"},{value:"resolved",label:"处理完成"}]}/></div>}
      <label>操作原因 / 处理记录<textarea name="reason" minLength={3} maxLength={1000} required rows={3} placeholder="填写问题背景与处理依据" defaultValue={values.reason}/></label>
      <div className="admin-dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="admin-primary" type="submit">预览变更<ArrowRight size={14} aria-hidden="true"/></button></div>
    </form> : <div>
      <dl className="admin-preview"><dt>操作对象</dt><dd>{draft.label}</dd><dt>原因</dt><dd>{String(preview.reason)}</dd>
        {draft.action==="compensate"&&<><dt>增加积分</dt><dd>+{number(preview.amount)}</dd><dt>到期时间</dt><dd>{preview.expiresAt?fullDate(preview.expiresAt):"无到期时间"}</dd><dt>关联编号</dt><dd>{String(preview.reference||"—")}</dd></>}
        {draft.action==="case"&&<><dt>处理状态</dt><dd>{word(preview.status)}</dd></>}
        {draft.action==="settings"&&<><dt>生成服务</dt><dd>{draft.pauseGeneration?"暂停":"开放"}</dd><dt>新结账</dt><dd>{draft.pauseCheckout?"暂停":"开放"}</dd></>}
        {draft.action==="recover"&&<><dt>处理规则</dt><dd>核验超过五分钟且未结算，按原批次退回积分。可用余额受来源批次状态影响。</dd></>}
      </dl>
      {error&&<p role="alert" className="admin-error-text">{error}</p>}
      <div className="admin-dialog-actions"><button disabled={pending} onClick={()=>{setPreview(null);setError("");}}><ArrowLeft size={14} aria-hidden="true"/>返回修改</button><button disabled={pending} className={draft.action==="ban"?"admin-danger":"admin-primary"} onClick={submit}>{pending?"提交中…":"确认提交"}</button></div>
    </div>}
  </dialog>;
}
