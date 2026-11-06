"use client";
import { useEffect, useRef, useState } from "react";
import { fullDate, number, word } from "./model";

export type ActionDraft = { action:string; target:string; label:string; sourceType?:string; pauseGeneration?:boolean; pauseCheckout?:boolean };
export function AdminActionDialog({ draft, onClose, onSuccess }: { draft: ActionDraft; onClose:()=>void; onSuccess:()=>void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [preview,setPreview] = useState<Record<string,unknown>|null>(null);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState("");
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close();},[]);
  const previewAction = (form: HTMLFormElement) => {
    const data = new FormData(form);
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
    <div className="admin-dialog-heading"><h2 id="admin-action-title">{word(draft.action)}</h2><button type="button" onClick={onClose} disabled={pending} aria-label="关闭操作">×</button></div>
    <p className="admin-muted">{draft.label}</p><p className="admin-id">{draft.target}</p>
    {!preview ? <form onSubmit={event=>{event.preventDefault();previewAction(event.currentTarget);}}>
      {draft.action==="compensate"&&<><label>补偿积分<input name="amount" type="number" min="1" max="100000" step="1" required defaultValue="10" /></label><p className="admin-muted">每张图片消耗 10 积分。</p><label>到期时间（UTC+8，可留空）<input type="datetime-local" name="expiresAt" /></label><label>关联订单或请求（可留空）<input name="reference" maxLength={256} /></label></>}
      {draft.action==="case"&&<label>处理状态<select name="status" defaultValue="processing"><option value="open">待处理</option><option value="processing">处理中</option><option value="resolved">已处理</option></select></label>}
      <label>操作原因 / 处理记录<textarea name="reason" minLength={3} maxLength={1000} required rows={3} placeholder="填写问题背景与处理依据" /></label>
      <div className="admin-dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="admin-primary" type="submit">预览变更</button></div>
    </form> : <div>
      <dl className="admin-preview"><dt>操作对象</dt><dd>{draft.label}</dd><dt>原因</dt><dd>{String(preview.reason)}</dd>
        {draft.action==="compensate"&&<><dt>增加积分</dt><dd>+{number(preview.amount)}</dd><dt>到期时间</dt><dd>{preview.expiresAt?fullDate(preview.expiresAt):"无到期时间"}</dd><dt>关联编号</dt><dd>{String(preview.reference||"—")}</dd></>}
        {draft.action==="case"&&<><dt>处理状态</dt><dd>{word(preview.status)}</dd></>}
        {draft.action==="settings"&&<><dt>生成服务</dt><dd>{draft.pauseGeneration?"暂停":"开放"}</dd><dt>新结账</dt><dd>{draft.pauseCheckout?"暂停":"开放"}</dd></>}
        {draft.action==="recover"&&<><dt>处理规则</dt><dd>核验超过五分钟且未结算，按原批次退回积分。可用余额受来源批次状态影响。</dd></>}
      </dl>
      {error&&<p role="alert" className="admin-error-text">{error}</p>}
      <div className="admin-dialog-actions"><button disabled={pending} onClick={()=>{setPreview(null);setError("");}}>修改</button><button disabled={pending} className="admin-primary" onClick={submit}>{pending?"提交中…":"确认提交"}</button></div>
    </div>}
  </dialog>;
}
