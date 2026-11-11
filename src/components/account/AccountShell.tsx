import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RefreshAccount } from "./AccountActions";
import { accountDate } from "@/lib/account/format";
import type { BillingSummary } from "@/lib/account/types";

export function AccountHeader({ title, page, action }: { title: string; page: "plans" | "billing" | "history"; action?: React.ReactNode }) {
  return <>
    <div className="account-page-heading"><div><h1>{title}</h1><p>{page === "history" ? "Find your past descriptions and copy the words you need." : page === "plans" ? "Your credits, their windows, and room for more images." : "Your subscription, payments, and billing controls."}</p></div>{action}</div>
    <nav className="account-page-tabs" aria-label="Account navigation">
      <Link href="/account/history" prefetch={false} aria-current={page === "history" ? "page" : undefined}>Description history</Link>
      <Link href="/account/plans" prefetch={false} aria-current={page === "plans" ? "page" : undefined}>Plans and credits</Link>
      <Link href="/account/billing" prefetch={false} aria-current={page === "billing" ? "page" : undefined}>Manage billing</Link>
    </nav>
  </>;
}

export function AccountDataError({ title }: { title: string }) {
  return <div className="account-data-error" role="alert"><p>{title} could not be loaded. Your account data has not been changed.</p><RefreshAccount /></div>;
}

export function AccountLoading({ label = "Loading your account…" }: { label?: string }) {
  return <div className="account-loading" role="status"><p>{label}</p><div className="account-loading-line" /><div className="account-loading-line" /></div>;
}

export function AccessDetails({ billing, compact = false }: { billing: BillingSummary; compact?: boolean }) {
  const subscription = billing.subscription;
  return <>
    <div className="account-section-top"><h2>{compact ? "Current access" : "Subscription"}</h2>
      {subscription && <span className="account-status">{subscription.statusLabel}</span>}</div>
    <p className="account-plan-name">{subscription?.hasAccess ? subscription.name : compact ? "Free access" : subscription ? subscription.name : "No active subscription"}</p>
    {subscription ? <>
      <dl className="account-facts">
        <div><dt>Billing interval</dt><dd>{subscription.interval === "yearly" ? "Yearly" : "Monthly"}</dd></div>
        <div><dt>{subscription.hasAccess ? "Paid access until" : subscription.statusLabel === "Expired" ? "Paid period ended" : "Recorded paid-through date"}</dt><dd><time dateTime={subscription.paidThrough}>{accountDate(subscription.paidThrough)}</time></dd></div>
      </dl>
      <p className="account-help">{subscription.hasAccess
        ? subscription.status === "active" ? "Batch processing and CSV export are included during your paid period." : "Renewal is canceled. Batch processing and CSV export remain available until your paid period ends."
        : subscription.statusLabel === "Expired" ? "Your paid period has ended. Purchased credits keep their own expiry terms." : "Payment status needs confirmation. Open the billing portal to review your subscription."}</p>
    </> : <p className="account-help">{compact ? "Single-image descriptions. A Starter Pack adds credits; Pro adds batch processing and CSV export." : "Starter Pack purchases are credit packs, with no recurring subscription."}</p>}
    {compact && <Link href="/account/billing" className="account-text-link">Manage billing<ArrowUpRight size={15} aria-hidden="true" /></Link>}
  </>;
}
