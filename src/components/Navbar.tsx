'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Layers, FileText, Zap, DollarSign } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Describe Image", icon: Sparkles },
    { href: "/image-description-generator", label: "Batch Generator", icon: Layers },
    { href: "/describe-this-image-in-detail", label: "Detailed Mode", icon: FileText },
    { href: "/ai-image-description", label: "AI Guide", icon: Zap },
    { href: "/how-to-use", label: "How to Use" },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
  ];

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            DI
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Describe<span className="text-blue-600">ThisImage</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/image-description-generator"
            className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5"
          >
            Batch Mode
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            Upgrade Pro
          </Link>
        </div>
      </div>
    </header>
  );
}

