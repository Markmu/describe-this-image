'use client';

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountDate, accountNumber } from "@/lib/account/format";
import { accountLoginUrl } from "@/lib/account/navigation";
import { OUTPUT_MODES, type OutputMode } from "@/lib/image-input";
import type { AccountPage, DescriptionHistoryEntry } from "@/lib/account/types";

const labels: Record<OutputMode, string> = { detailed: "Detailed description", short: "Caption", alt: "Alt text", social: "Social caption" };

export function DescriptionHistory({ initial }: { initial: AccountPage<DescriptionHistoryEntry> | null }) {
  const [items, setItems] = useState(initial?.items ?? []);
  const [cursor, setCursor] = useState(initial?.nextCursor ?? null);
  const [unavailable, setUnavailable] = useState(!initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initial ? "" : "Description history could not be loaded. Please try again.");
  const [copyError, setCopyError] = useState("");
  const [copied, setCopied] = useState("");
  const lock = useRef(false);
  const router = useRouter();

  async function load() {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try {
      const response = await fetch(`/api/account/history${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (response.status === 401) { router.push(accountLoginUrl("/account/history")); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Description history could not be loaded. Please try again.");
      setItems(previous => {
        const seen = new Set(previous.map(item => item.id));
        return [...previous, ...data.items.filter((item: DescriptionHistoryEntry) => !seen.has(item.id))];
      });
      setCursor(data.nextCursor); setUnavailable(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Description history could not be loaded. Please try again."); }
    finally { lock.current = false; setPending(false); }
  }

  async function copy(item: DescriptionHistoryEntry, mode: OutputMode) {
    setCopyError(""); setCopied("");
    try { await navigator.clipboard.writeText(item.outputs[mode]); setCopied(`${item.id}:${mode}`); }
    catch { setCopyError("Clipboard access failed. Select and copy the description text."); }
  }

  return <section className="account-panel description-history" aria-labelledby="saved-descriptions-title">
    <div className="account-section-top"><h2 id="saved-descriptions-title">Saved descriptions</h2><Link href="/" className="account-text-link">Describe an image</Link></div>
    <p className="account-help description-retention">An active Pro subscription keeps your full history. When your paid period ends, all descriptions follow a 30-day limit measured from each request. Each entry includes all four formats. Dates in UTC.</p>
    <div className="description-history-list">{items.map(item => <details key={item.id} className="description-history-entry">
      <summary><span className="description-history-caption">{item.outputs.short}</span><span className="description-history-meta">
        <time dateTime={item.createdAt}>{accountDate(item.createdAt)}</time><span>{item.language}{item.batch ? " · Batch" : ""}</span>
        <span>{item.subscriptionActive ? "Retained with Pro" : `Expires ${accountDate(item.expiresAt!)}`}</span>
      </span><span className="description-history-open">View descriptions</span></summary>
      <div className="description-history-outputs">{OUTPUT_MODES.map(mode => <section key={mode}>
        <div className="account-section-top"><h3>{labels[mode]}</h3><button type="button" className="account-text-link" onClick={() => copy(item, mode)} aria-label={`Copy ${labels[mode].toLowerCase()}`}>
          {copied === `${item.id}:${mode}` ? "Copied" : "Copy text"}</button></div>
        <p>{item.outputs[mode]}</p>
      </section>)}</div>
    </details>)}</div>
    {!unavailable && items.length === 0 && <p className="account-empty">Your generated descriptions will appear here. <Link href="/" className="account-text-link">Describe your first image</Link></p>}
    {error && <p role="alert" className="account-inline-error">{error}</p>}
    {copyError && <p role="alert" className="account-inline-error">{copyError}</p>}
    <span className="sr-only" role="status">{copied ? "Description copied to clipboard." : ""}</span>
    {(unavailable || cursor) && <button type="button" className="account-button account-button-secondary account-history-more" disabled={pending} onClick={load} aria-busy={pending}>{pending ? "Loading…" : error ? "Retry" : "Load more"}</button>}
    {items.length > 0 && <p className="account-help" role="status">{accountNumber(items.length)} descriptions shown{cursor ? " · More available" : ""}</p>}
  </section>;
}
