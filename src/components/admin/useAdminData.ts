"use client";
import { useEffect, useState } from "react";

type Snapshot<T> = { key: string; url?: string; data?: T; error?: string; updatedAt?: string };

export function useAdminData<T>(url: string | null, revision: number) {
  const key = `${url}:${revision}`;
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ key: "" });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]), cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "管理数据读取失败。");
      return body as T;
    }).then(data => setSnapshot({ key, url, data, updatedAt: new Date().toISOString() })).catch(error => {
      if (!controller.signal.aborted) setSnapshot(previous => ({
        ...(previous.url === url ? previous : {}), key, url,
        error: error instanceof Error ? error.message : "管理数据读取失败。",
      }));
    });
    return () => controller.abort();
  }, [url, key]);
  return {
    data: snapshot.url === url ? snapshot.data : undefined,
    error: snapshot.key === key ? snapshot.error : undefined,
    updatedAt: snapshot.url === url ? snapshot.updatedAt : undefined,
    loading: Boolean(url && snapshot.key !== key),
  };
}
