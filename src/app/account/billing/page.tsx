import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight } from "lucide-react";
import { requireAccountPage } from "@/lib/account/session";
import { getAccountPayments, getBillingSummary } from "@/lib/account/queries";
import { accountDate, accountMoney } from "@/lib/account/format";
import { AccountDataError, AccountHeader, AccountLoading, AccessDetails } from "@/components/account/AccountShell";
import { BillingPortalButton, RefreshAccount } from "@/components/account/AccountActions";
import { AccountHistory } from "@/components/account/AccountHistory";

export const metadata = { title: "Manage billing" };

async function BillingContent() {
  await connection();
  const userId = await requireAccountPage("/account/billing");
  const [billing, payments] = await Promise.allSettled([getBillingSummary(userId), getAccountPayments(userId)]);
  const summary = billing.status === "fulfilled" ? billing.value : null;
  const history = payments.status === "fulfilled" ? payments.value : null;
  return <div className="account-content">
    <div className="account-overview account-billing-overview">
      <section className="account-panel" aria-label="Subscription">{summary ? <AccessDetails billing={summary} /> : <><h2>Subscription</h2><AccountDataError title="Subscription details" /></>}</section>
      <section className="account-panel account-payment-details" aria-labelledby="payment-details-title"><h2 id="payment-details-title">Payment details</h2>
        {summary && !summary.canOpenPortal ? <><p className="account-plan-name">No billing account yet</p><p className="account-help">A billing account is linked after checkout. Explore plans to make your first purchase.</p><Link className="account-button account-button-primary" href="/pricing">View plans<ArrowUpRight size={16} aria-hidden="true" /></Link></>
          : <><p>Manage payment methods, billing address, receipts, and subscription changes in Creem.</p><BillingPortalButton /><p className="account-help">You can also use the portal link in your Creem receipt.</p></>}
      </section>
    </div>
    {summary && summary.pendingOrders.length > 0 && <section className="account-panel" aria-labelledby="pending-title"><div className="account-section-top"><h2 id="pending-title">Awaiting payment confirmation</h2><span className="account-status">Pending</span></div>
      <p className="account-help">A checkout is awaiting confirmation. Check its status before starting another payment.</p>
      <ul className="account-pending-orders">{summary.pendingOrders.map(order => <li key={order.id}><div><span>{order.name} · {accountMoney(order.amountCents, order.currency)}</span><small>Started {accountDate(order.createdAt)}</small></div>
        <Link href={`/billing/success?local_order_id=${encodeURIComponent(order.id)}`} className="account-text-link">Check status<ArrowUpRight size={15} aria-hidden="true" /></Link></li>)}</ul>
    </section>}
    <AccountHistory key={JSON.stringify(history)} kind="payments" initial={history} />
    <section className="account-billing-footnote" aria-label="Credits help"><p>Looking for your balance and monthly credit windows?</p><Link href="/account/plans" className="account-text-link">Plans and credits<ArrowUpRight size={15} aria-hidden="true" /></Link></section>
  </div>;
}

export default function BillingPage() {
  return <><AccountHeader title="Manage billing" page="billing" action={<RefreshAccount />} />
    <Suspense fallback={<AccountLoading label="Loading your billing details…" />}><BillingContent /></Suspense></>;
}
