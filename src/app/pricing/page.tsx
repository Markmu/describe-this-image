import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Plus,
  CreditCard
} from "lucide-react";
import { PricingCheckoutButton } from "@/components/PricingCheckoutButton";

export const metadata: Metadata = {
  title: "Pricing Plans – Describe This Image Pro & Credit Packs",
  description: "Compare a $9.99 pack of 300 credits, $9.90 monthly Pro, and $49.90 annual Pro. Pro includes 2,000 credits per month. Add 1,000 credits for $5.",
  alternates: {
    canonical: "https://describethisimage.com/pricing/",
  },
};

export default function PricingPage() {
  const plans = [
    {
      id: "free" as const,
      name: "Free",
      tag: "Free Trial",
      price: "$0",
      period: "free tier",
      unitCost: "$0 / image",
      description: "One guest description. Sign in with Google for 10 free descriptions per day.",
      featured: false,
      buttonText: "Use Free Tool",
      buttonHref: "/",
      features: [
        "1 free description without login",
        "10 free descriptions per day after login",
        "Image upload and supported image links",
        "All 4 formats (Detailed, Short, Alt, Social)",
        "Eight output languages",
      ],
    },
    {
      id: "starter" as const,
      name: "Starter Pack",
      tag: "One-Time Pack",
      price: "$9.99",
      period: "one-time",
      unitCost: "$0.033 / image",
      description: "300 credits in a single purchase with no recurring billing.",
      featured: false,
      buttonText: "Buy Starter Pack",
      features: [
        "300 image descriptions included",
        "Credits never expire",
        "Single payment, no recurring billing",
        "Four description formats",
        "Single-image workflow with alt text",
        "Eight output languages",
      ],
    },
    {
      id: "pro-month" as const,
      name: "Pro Monthly",
      tag: "Monthly Pro",
      price: "$9.90",
      period: "per month",
      unitCost: "$0.005 / image",
      description: "2,000 credits per month. Billed $9.90 each month.",
      featured: false,
      buttonText: "Get Pro Monthly",
      features: [
        "2,000 image descriptions per month",
        "Bulk upload & batch processing",
        "Alt text spreadsheet (CSV) export",
        "Eight output languages",
      ],
    },
    {
      id: "pro-year" as const,
      name: "Pro Annual",
      tag: "Annual Billing · Save 58%",
      price: "$49.90",
      period: "per year ($4.16/mo)",
      unitCost: "$0.0021 / image",
      description: "Billed $49.90 each year. Includes 2,000 credits each month. Monthly credits expire at the next monthly window.",
      featured: true,
      buttonText: "Get Pro Annual",
      features: [
        "2,000 credits per month for 12 months",
        "About $4.16 per month, billed each year",
        "Full batch processing & CSV export",
        "Eight output languages",
      ],
    },
  ];

  const comparisonRows = [
    {
      plan: "Free",
      price: "$0",
      quota: "One guest description; 10 per day after login",
      unitCost: "$0",
      purpose: "Try a description before choosing a paid plan",
      highlight: false,
    },
    {
      plan: "Starter Pack",
      price: "$9.99 one-time",
      quota: "300 credits, never expires",
      unitCost: "$0.033",
      purpose: "A single purchase for occasional use",
      highlight: false,
    },
    {
      plan: "Pro Monthly",
      price: "$9.90 / mo",
      quota: "2,000 credits per month",
      unitCost: "$0.005",
      purpose: "A monthly allowance for ongoing image work",
      highlight: false,
    },
    {
      plan: "Pro Annual",
      price: "$49.90 / year",
      quota: "2,000 credits per month for 12 months",
      unitCost: "$0.0021",
      purpose: "Annual billing at a lower total price than 12 monthly payments",
      highlight: true,
    },
    {
      plan: "Add-on Credits",
      price: "$5.00 per 1,000 credits",
      quota: "1,000 credits per purchase",
      unitCost: "$0.005",
      purpose: "Extra credits for a larger workload",
      highlight: false,
    },
  ];

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          Back to Free Tool
        </Link>

        {/* Pricing Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Plans & Credits</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Choose a plan for your images
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Try one image without an account. Sign in for 10 free descriptions per day. Paid plans add credits for larger workloads. Image generation depends on service availability.
          </p>
        </div>

        {/* Main 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "rounded-2xl p-6 flex flex-col justify-between transition-all relative bg-white border-2 border-blue-600 shadow-xl ring-4 ring-blue-50"
                  : "rounded-2xl p-6 flex flex-col justify-between transition-all relative bg-white border border-gray-200 shadow-xs hover:shadow-md"
              }
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Annual Plan
                </span>
              )}

              <div>
                <div
                  className={
                    plan.featured
                      ? "text-[11px] font-bold uppercase tracking-wider mb-2 text-blue-600"
                      : "text-[11px] font-bold uppercase tracking-wider mb-2 text-gray-400"
                  }
                >
                  {plan.tag}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                <p className="text-xs text-gray-500 mb-4 min-h-[32px]">{plan.description}</p>

                <div className="border-y border-gray-100 py-4 mb-4 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-500">{plan.period}</span>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-600">
                    Cost per included credit: {plan.unitCost}
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-700">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className={
                          plan.featured
                            ? "w-4 h-4 shrink-0 mt-0.5 text-blue-600"
                            : "w-4 h-4 shrink-0 mt-0.5 text-emerald-600"
                        }
                      />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                {plan.id === "free" ? (
                  <Link
                    href="/"
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold text-xs text-center block transition-colors"
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <PricingCheckoutButton
                    offerId={plan.id}
                    label={plan.buttonText}
                    featured={plan.featured}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add-on Banner (超出加购) */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold">
              <Plus aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Extra Credits</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Add 1,000 credits for $5
            </h3>
            <p className="text-xs sm:text-sm text-blue-200 max-w-2xl leading-relaxed">
              Each pack includes <strong className="text-white font-bold">1,000 credits for $5.00</strong> ($0.005 per credit). This is a one-time purchase for extra image descriptions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-center md:text-right">
              <div className="text-2xl font-black text-white">$0.005</div>
              <div className="text-[11px] text-blue-200">per credit (1,000 min)</div>
            </div>
            <PricingCheckoutButton
              offerId="addon-1000"
              label="Purchase Add-on Credits"
              className="px-5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            />
          </div>
        </div>

        {/* Plan Comparison Table (方案对比表) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Compare Plans
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Compare prices and credit allowances. Unit costs are rounded and assume use of the full allowance.
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400">Payment: Powered by Creem</span>
          </div>

          <div className="overflow-x-auto" role="region" aria-label="Plan comparison" tabIndex={0}>
            <table className="w-full min-w-[640px] text-left border-collapse text-xs">
              <caption className="sr-only">Plan prices, credit allowances, and costs in US dollars</caption>
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Plan</th>
                  <th scope="col" className="py-3.5 px-4">Price</th>
                  <th scope="col" className="py-3.5 px-4">Included credits</th>
                  <th scope="col" className="py-3.5 px-4">Cost per credit (USD)</th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Use case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {comparisonRows.map((row) => (
                  <tr
                    key={row.plan}
                    className={
                      row.highlight
                        ? "bg-blue-50/20 font-medium hover:bg-blue-50/30 transition-colors"
                        : "hover:bg-blue-50/30 transition-colors"
                    }
                  >
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 flex items-center gap-2">
                      {row.plan}
                      {row.highlight && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                          Annual
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      {row.price}
                    </td>
                    <td className="py-4 px-4 max-w-xs leading-relaxed">
                      {row.quota}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {row.unitCost}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-gray-600 max-w-sm leading-relaxed">
                      {row.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Badges with Creem and Google */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-wrap items-center justify-around gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CreditCard aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <span>Payments through Creem</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <span>Starter & Add-on credits never expire</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <span>Monthly or annual subscription billing</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 text-blue-600" />
            <span>Google login: 10 free descriptions per day</span>
          </div>
        </div>
      </div>
    </main>
  );
}
