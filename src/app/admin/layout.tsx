import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin/access";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";

export const metadata: Metadata = { title: "管理后台", robots: { index: false, follow: false }, referrer: "same-origin" };

async function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<main id="main-content" className="admin-loading" role="status">加载管理工作台…</main>}><ProtectedAdmin>{children}</ProtectedAdmin></Suspense>;
}
