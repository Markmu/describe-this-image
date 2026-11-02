'use client';

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface PricingCheckoutButtonProps {
  offerId: "starter" | "pro-month" | "pro-year" | "addon-1000";
  label: string;
  featured?: boolean;
  className?: string;
}

export function PricingCheckoutButton({
  offerId,
  label,
  featured = false,
  className = "",
}: PricingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const router = useRouter();

  const handleCheckout = async () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json();
      if (res.status === 401) { router.push("/billing/login"); setLoading(false); pending.current=false; return; }
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to initiate Creem checkout");
      }

      // Redirect user directly to Creem checkout URL
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout error occurred";
      setError(message);
      setLoading(false);
      pending.current = false;
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={
          className || (
            featured
              ? "w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-center block transition-all shadow-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              : "w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-center block transition-all shadow-xs border border-gray-300 text-gray-800 hover:bg-gray-50 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          )
        }
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Connecting to Creem...</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>

      {error && (
        <div role="alert" className="text-sm text-red-700 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
