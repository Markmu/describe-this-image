import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing Plans – Describe This Image Pro & API",
  description: "Flexible pricing plans for individuals, e-commerce stores, and enterprise teams. Start free without login or unlock bulk generation and developer API access.",
  alternates: {
    canonical: "https://describethisimage.com/pricing/",
  },
};

export default function PricingPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Free Tool
        </Link>

        {/* Pricing Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fair & Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Simple Plans for Every Need
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Start 100% free with no account required. Upgrade anytime for batch processing, CSV exports, high-volume limits, and developer API keys.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Free Starter</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Web Free</h2>
              <p className="text-xs text-gray-500 mb-6">Perfect for occasional visual checks and casual use.</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-xs text-gray-500">/ forever</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No login or registration required</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Single image drag-and-drop & URL paste</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 4 output formats (Detailed, Short, Alt, Social)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Multilingual language toggle</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold text-xs text-center block transition-colors"
              >
                Use Free Tool
              </Link>
            </div>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 shadow-lg relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </span>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Professional</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro Batch</h2>
              <p className="text-xs text-gray-500 mb-6">Built for SEO managers, merchants, and creators.</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$19</span>
                <span className="text-xs text-gray-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">Unlimited batch uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">Instant CSV spreadsheet export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Ultra-detailed multi-paragraph scene analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>High-speed dedicated GPU processing queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Priority email & chat support</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs text-center block shadow-md transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Developer / Enterprise */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Developer & Team</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">API & Scale</h2>
              <p className="text-xs text-gray-500 mb-6">For programmatic integration and CMS workflows.</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$79</span>
                <span className="text-xs text-gray-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>REST API Access with bearer token authentication</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>50,000 API calls per month included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom prompt structuring & webhook callbacks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>99.9% uptime SLA guarantee</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 font-semibold text-xs text-center block transition-colors"
              >
                Get API Access
              </button>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 flex flex-wrap items-center justify-around gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Secure 256-bit SSL encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Cancel subscription at any time</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>7-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

