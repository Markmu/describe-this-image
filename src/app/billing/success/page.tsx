'use client';
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
type Order = { id:string;status:string;offer:string };
function Receipt() {
  const id = useSearchParams().get("local_order_id");
  const [order,setOrder] = useState<Order | null>(null);
  const [error,setError] = useState("");
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    async function load() {
      try {
        const response = await fetch("/api/billing/order?id="+encodeURIComponent(id!),{cache:"no-store",signal:controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Order status is unavailable.");
        setOrder(data); setError("");
        if (data.status === "pending" && ++polls < 15) timer = setTimeout(load,3000);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Order status is unavailable.");
      }
    }
    void load();
    return () => { controller.abort();clearTimeout(timer); };
  },[id,attempt]);
  const confirmed = order?.status === "confirmed";
  return <div className="max-w-xl mx-auto rounded-3xl border border-zinc-200 bg-white p-7 sm:p-12 space-y-6">
    <p className="text-sm font-mono text-blue-700">YOUR ORDER</p>
    <h1 className="text-3xl font-semibold tracking-tight">{confirmed ? "Payment confirmed" : order?.status === "revoked" ? "Payment reversed" : "Checking your order"}</h1>
    <p role="status" className="text-zinc-600 leading-relaxed">{!id ? "This link does not contain an order reference. Open the return link from your checkout."
      : error || (confirmed ? "Your payment is verified and your credits are available."
      : order?.status === "revoked" ? "Credits associated with this payment have been withdrawn."
      : "Waiting for payment confirmation. You can return to this page to check its status. Do not pay again while confirmation is pending.")}</p>
    {order && <dl className="bg-zinc-50 rounded-xl p-4 text-sm space-y-2"><dt className="text-zinc-500">Plan</dt><dd>{order.offer}</dd><dt className="text-zinc-500">Order reference</dt><dd className="break-all font-mono">{order.id}</dd></dl>}
    {id && !confirmed && <button onClick={() => setAttempt(value => value+1)} className="border border-zinc-300 rounded-xl px-4 py-3 text-sm font-semibold">Check status</button>}
    <Link className="block rounded-xl bg-blue-600 text-white text-center p-3 font-semibold" href="/">Return to image describer</Link>
    <Link className="block text-sm underline" href="/billing/login">Sign in to your purchasing account</Link>
    <p className="text-xs text-zinc-500">Manage subscriptions and payment methods through the billing portal in your account menu or the link in your Creem receipt.</p>
  </div>;
}
export default function BillingSuccessPage() {
  return <main id="main-content" className="bg-zinc-50 flex-1 px-4 py-16"><Suspense fallback={<p className="text-center">Loading order…</p>}><Receipt /></Suspense></main>;
}
