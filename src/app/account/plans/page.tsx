import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight } from "lucide-react";
import { requireAccountPage } from "@/lib/account/session";
import { getBillingSummary, getCreditActivity, getCreditSummary } from "@/lib/account/queries";
import { accountDate, accountNumber } from "@/lib/account/format";
import { CREDITS_PER_IMAGE, STARTER_CREDITS, STARTER_IMAGES, STARTER_PRICE } from "@/lib/plans";
import { AccountDataError, AccountHeader, AccountLoading, AccessDetails } from "@/components/account/AccountShell";
import { RefreshAccount } from "@/components/account/AccountActions";
import { AccountHistory } from "@/components/account/AccountHistory";
import { PricingCheckoutButton } from "@/components/PricingCheckoutButton";

export const metadata = { title: "Plans and credits" };

async function PlansContent() {
  await connection();
  const userId = await requireAccountPage("/account/plans");
  const [credits, billing, activity] = await Promise.allSettled([getCreditSummary(userId), getBillingSummary(userId), getCreditActivity(userId)]);
  const summary = credits.status === "fulfilled" ? credits.value : null;
  const history = activity.status === "fulfilled" ? activity.value : null;
  return <div className="account-content">
    <div className="account-overview">
      <section className="account-panel account-balance" aria-labelledby="balance-title"><div className="account-section-top"><h2 id="balance-title">Available credits</h2><RefreshAccount /></div>
        {summary ? <><p className="account-balance-value">{accountNumber(summary.remaining)}<span> credits</span></p>
          <p className="account-balance-caption">Enough for {accountNumber(summary.descriptions)} image description{summary.descriptions === 1 ? "" : "s"}.</p>
          <p className="account-help">{CREDITS_PER_IMAGE} credits per image, with all four text formats.</p>
          <Link className="account-text-link" href="#credit-breakdown">View credit breakdown<ArrowUpRight size={15} aria-hidden="true" /></Link>
          {summary.remaining < CREDITS_PER_IMAGE && <Link className="account-text-link" href="#more-credits">Add credits<ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </> : <AccountDataError title="Credit balance" />}
      </section>
      <section className="account-panel" aria-label="Current access">{billing.status === "fulfilled" ? <AccessDetails billing={billing.value} compact /> : <><h2>Current access</h2><AccountDataError title="Subscription details" /></>}</section>
    </div>
    <div className="account-ledger-columns">
    <section id="credit-breakdown" className="account-panel" aria-labelledby="breakdown-title"><div className="account-section-top"><h2 id="breakdown-title">Credit breakdown</h2><span className="account-help">Available sources</span></div>
      {summary ? <>
        <table className="account-table account-credit-table"><caption className="sr-only">Available credits by source</caption><thead><tr><th scope="col">Source</th><th scope="col">Available</th><th scope="col">Expiry</th></tr></thead>
          <tbody>{summary.sources.map(source => <tr key={source.id}><td><span>{source.label}</span>
            {source.kind === "subscription" && <div className="account-credit-progress"><progress aria-label="Monthly credits remaining" value={source.remaining} max={source.amount} /><small>{accountNumber(source.remaining)} of {accountNumber(source.amount)} credits left</small></div>}</td>
            <td className="account-numeric">{accountNumber(source.remaining)}</td><td className="account-expiry">{source.expiresAt ? <time dateTime={source.expiresAt}>{accountDate(source.expiresAt)}</time> : "No expiry"}</td></tr>)}</tbody>
        </table>
        {summary.sources.length === 0 && <p className="account-empty">No credit sources available.</p>}
        {summary.nextWindow && <p className="account-window-note">Next monthly window: {accountNumber(summary.nextWindow.amount)} credits on <time dateTime={summary.nextWindow.startsAt}>{accountDate(summary.nextWindow.startsAt)}</time>.</p>}
        <p className="account-help">Subscription credits expire at the end of each monthly window. Future windows are excluded from your available balance. Dates in UTC.</p>
      </> : <AccountDataError title="Credit sources" />}
    </section>
    <AccountHistory key={JSON.stringify(history)} kind="credits" initial={history} />
    </div>
    <section id="more-credits" className="account-purchase" aria-labelledby="more-title"><div><h2 id="more-title">Need more credits?</h2><p>Starter Pack · {STARTER_PRICE} once for {accountNumber(STARTER_CREDITS)} credits.<br />{STARTER_IMAGES} image descriptions, with no expiry.</p><p className="account-help">For batch processing and CSV export, choose Pro.</p></div>
      <div className="account-purchase-actions"><PricingCheckoutButton offerId="starter" label="Buy Starter Pack" returnTo="/account/plans" className="account-button account-button-primary" /><Link className="account-text-link" href="/pricing">Explore Pro plans<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
    </section>
  </div>;
}

export default function PlansPage() {
  return <><AccountHeader title="Plans and credits" page="plans" action={<Link href="/pricing" className="account-button account-button-secondary">Explore plans<ArrowUpRight size={16} aria-hidden="true" /></Link>} />
    <Suspense fallback={<AccountLoading label="Loading your credits…" />}><PlansContent /></Suspense></>;
}
