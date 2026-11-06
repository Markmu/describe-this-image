'use client';

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountDate, accountNumber, accountMoney } from "@/lib/account/format";
import { accountLoginUrl } from "@/lib/account/navigation";
import type { AccountPage, AccountPayment, CreditActivity } from "@/lib/account/types";

type HistoryProps = { kind: "credits"; initial: AccountPage<CreditActivity> | null } | { kind: "payments"; initial: AccountPage<AccountPayment> | null };

export function AccountHistory({ kind, initial }: HistoryProps) {
  const [items, setItems] = useState<(CreditActivity | AccountPayment)[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState(initial?.nextCursor ?? null);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(!initial);
  const [error, setError] = useState(initial ? "" : "History could not be loaded. Please try again.");
  const lock = useRef(false);
  const router = useRouter();
  async function load() {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try {
      const response = await fetch(`/api/account/${kind}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (response.status === 401) { router.push(accountLoginUrl(kind === "credits" ? "/account/plans" : "/account/billing")); return; }
      if (!response.ok) throw new Error(data.error || "History could not be loaded. Please try again.");
      setItems(previous => {
        const seen = new Set(previous.map(item => item.id));
        return [...previous, ...data.items.filter((item: CreditActivity | AccountPayment) => !seen.has(item.id))];
      });
      setCursor(data.nextCursor); setUnavailable(false); setExpanded(true);
    } catch (error) { setError(error instanceof Error ? error.message : "History could not be loaded. Please try again."); }
    finally { lock.current = false; setPending(false); }
  }
  const title = kind === "credits" ? "Recent credit activity" : "Payment history";
  const visible = expanded ? items : items.slice(0, 4);
  return <section className="account-panel account-history" aria-labelledby={`${kind}-history-title`}>
    <div className="account-section-top"><h2 id={`${kind}-history-title`}>{title}</h2>
      {!expanded && items.length > 4 && <button className="account-text-link" onClick={() => setExpanded(true)}>View all {kind === "credits" ? "activity" : "payments"}</button>}</div>
    <p className="account-help">{kind === "credits" ? "Credits added, reserved, returned, and monthly windows. Dates in UTC." : "Verified transactions, including renewals. Dates in UTC. Receipts and transaction amounts are available in Creem."}</p>
    {visible.length > 0 && <table className={`account-table${kind === "payments" ? " account-payment-table" : ""}`}><caption className="sr-only">{title}</caption>
      <thead><tr><th scope="col">{kind === "credits" ? "Activity" : "Payment"}</th><th scope="col">Date</th><th scope="col">{kind === "credits" ? "Credit change" : "Status"}</th>{kind === "payments" && <th scope="col">Amount</th>}</tr></thead>
      <tbody>{visible.map(item => <tr key={item.id}>
        <td>{"label" in item ? <><span>{item.label}</span>{item.detail && <small>{item.detail}</small>}</> : <><span>{item.name}</span><small>{item.periodStart && item.periodEnd ? `${accountDate(item.periodStart)} – ${accountDate(item.periodEnd)}` : "One-time purchase"}</small></>}</td>
        <td className="account-date"><time dateTime={item.createdAt}>{accountDate(item.createdAt)}</time></td>
        <td className={kind === "credits" ? "account-numeric" : "account-payment-status"}>{"delta" in item ? <span>{item.delta === null ? "—" : `${item.delta > 0 ? "+" : ""}${accountNumber(item.delta)}`}</span> : <span className="account-status">{item.status === "reversed" ? "Reversed" : "Confirmed"}</span>}</td>
        {kind === "payments" && <td className="account-numeric" title={"amountCents" in item && item.amountCents !== null ? "Verified transaction amount" : "View transaction amounts in Creem"}>{"amountCents" in item && item.amountCents !== null ? accountMoney(item.amountCents) : "—"}</td>}
      </tr>)}</tbody>
    </table>}
    {!unavailable && items.length === 0 && <p className="account-empty">{kind === "credits" ? "No credit activity to show." : "No payments yet. Purchases will appear here after confirmation."}</p>}
    {error && <p role="alert" className="account-inline-error">{error}</p>}
    {(unavailable || (expanded && cursor)) && <button className="account-button account-button-secondary account-history-more" disabled={pending} onClick={load} aria-busy={pending}>{pending ? "Loading…" : error ? "Retry" : "Load more"}</button>}
    {expanded && items.length > 0 && <p className="account-help account-history-count" role="status">{accountNumber(items.length)} entries shown{cursor ? " · More available" : ""}</p>}
  </section>;
}
