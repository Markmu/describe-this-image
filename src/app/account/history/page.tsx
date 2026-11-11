import { Suspense } from "react";
import { connection } from "next/server";
import { requireAccountPage } from "@/lib/account/session";
import { getDescriptionHistory } from "@/lib/account/queries";
import { AccountHeader, AccountLoading } from "@/components/account/AccountShell";
import { RefreshAccount } from "@/components/account/AccountActions";
import { DescriptionHistory } from "@/components/account/DescriptionHistory";

export const metadata = { title: "Description history" };

async function HistoryContent() {
  await connection();
  const userId = await requireAccountPage("/account/history");
  const initial = await getDescriptionHistory(userId).catch(() => null);
  return <DescriptionHistory key={JSON.stringify(initial)} initial={initial} />;
}

export default function HistoryPage() {
  return <>
    <AccountHeader title="Description history" page="history" action={<RefreshAccount />} />
    <Suspense fallback={<AccountLoading label="Loading your descriptions…" />}><HistoryContent /></Suspense>
  </>;
}
