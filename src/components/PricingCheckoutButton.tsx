'use client';

import { useRef, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
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
    <div className="checkout-control">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        aria-busy={loading}
        className={
          className || (
            featured
              ? "design-button checkout-button"
              : "quiet-button checkout-button"
          )
        }
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
            <span>Connecting to Creem...</span>
          </>
        ) : (
          <><span>{label}</span>{featured && <ArrowUpRight size={17} aria-hidden="true" />}</>
        )}
      </button>

      {error && (
        <div role="alert" className="checkout-message">
          {error}
        </div>
      )}
    </div>
  );
}
