"use client";
import { useEffect, useState } from "react";

export function useAdminData<T>(url: string | null, revision: number) {
  const key = `${url}:${revision}`;
  const [snapshot, setSnapshot] = useState<{ key: string; data?: T; error?: string }>({key:""});
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, {signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]),cache:"no-store"}).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "管理数据读取失败。");
      return body as T;
    }).then(data => setSnapshot({key,data})).catch(error => {
      if (!controller.signal.aborted) setSnapshot({key,error:error instanceof Error?error.message:"管理数据读取失败。"});
    });
    return () => controller.abort();
  },[url,key]);
  return { data: snapshot.key === key ? snapshot.data : undefined, error: snapshot.key === key ? snapshot.error : undefined, loading: Boolean(url && snapshot.key !== key) };
}
