'use client';

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { accountLoginUrl } from "@/lib/account/navigation";

export function RefreshAccount() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="account-button account-button-secondary" onClick={() => startTransition(() => router.refresh())} disabled={pending} aria-busy={pending}>
    <RefreshCw size={15} aria-hidden="true" />{pending ? "Refreshing…" : "Refresh"}
  </button>;
}

export function BillingPortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [noAccount, setNoAccount] = useState(false);
  const lock = useRef(false);
  const router = useRouter();
  async function openPortal() {
    if (lock.current) return;
    lock.current = true;
    setPending(true); setError(""); setNoAccount(false);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST", signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (response.status === 401) { router.push(accountLoginUrl("/account/billing")); return; }
      if (!response.ok) {
        setNoAccount(data.code === "NO_BILLING_ACCOUNT");
        throw new Error(data.error || "The billing portal is unavailable. Please try again.");
      }
      if (typeof data.url !== "string" || !data.url) throw new Error("The billing portal link is unavailable. Please try again.");
      window.location.assign(data.url);
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The billing portal timed out. Please try again.");
    } finally { lock.current = false; setPending(false); }
  }
  return <div className="account-portal-control">
    <button type="button" className="account-button account-button-primary" onClick={openPortal} disabled={pending} aria-busy={pending}>
      {pending ? "Opening billing…" : "Open billing portal"}<ArrowUpRight size={16} aria-hidden="true" />
    </button>
    {error && <div className="account-inline-error" role="alert"><p>{error}</p>{noAccount && <Link href="/pricing">View plans</Link>}</div>}
  </div>;
}
