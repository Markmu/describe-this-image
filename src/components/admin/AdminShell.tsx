"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Aperture, ChartNoAxesCombined, Users, Receipt, Coins, ScanLine, Settings2, ClipboardList, ArrowUpRight, ChevronRight, LogOut, Menu, X } from "lucide-react";

const groups = [
  { label: "工作空间", links: [["/admin", "运营概览", ChartNoAxesCombined], ["/admin/users", "用户管理", Users], ["/admin/billing", "订单与订阅", Receipt], ["/admin/credits", "积分与补偿", Coins]] },
  { label: "服务运营", links: [["/admin/requests", "生成与审核", ScanLine], ["/admin/operations", "系统与任务", Settings2], ["/admin/audit", "操作日志", ClipboardList]] },
] as const;

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = groups.flatMap(group => [...group.links]).find(([href]) => pathname === href)?.[1] ?? "管理工作台";

  useEffect(() => {
    const node = dialog.current;
    if (open) node?.showModal();
    else if (node?.open) node.close();
    const media = window.matchMedia("(min-width: 1101px)");
    const fold = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", fold);
    return () => media.removeEventListener("change", fold);
  }, [open]);

  const navigation = <>
    <Link href="/admin" className="admin-wordmark" onClick={() => setOpen(false)}><Aperture size={29} strokeWidth={1.6} aria-hidden="true" /><span>Describe<br />this image<span className="admin-brand-dot">.</span></span></Link>
    <div className="admin-workspace-label"><span className="admin-workspace-dot" />运营工作台<span>站长版</span></div>
    <nav aria-label="管理后台导航">{groups.map(group => <div className="admin-nav-group" key={group.label}><p>{group.label}</p>{group.links.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} strokeWidth={1.65} aria-hidden="true" /><span>{label}</span>{pathname === href && <ChevronRight size={13} aria-hidden="true" />}</Link>)}</div>)}</nav>
    <div className="admin-sidebar-bottom"><div className="admin-operator"><span className="admin-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span><div><strong>站长账户</strong><p title={email}>{email}</p></div><button title="退出登录" aria-label="退出登录" onClick={() => signOut({ redirectTo: "/" })}><LogOut size={16} /></button></div><p className="admin-sidebar-caption">Describe This Image · Operations</p></div>
  </>;

  return <div className="admin-console" lang="zh-CN">
    <aside className="admin-sidebar">{navigation}</aside>
    <dialog ref={dialog} className="admin-mobile-navigation" aria-label="导航菜单" onCancel={() => setOpen(false)} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX > rect.right) setOpen(false); } }}>
      <button className="admin-nav-close" onClick={() => setOpen(false)} aria-label="关闭导航"><X size={20} /></button>{navigation}
    </dialog>
    <div className="admin-frame">
      <div className="admin-topbar"><button ref={trigger} className="admin-menu" aria-haspopup="dialog" aria-expanded={open} aria-label="打开导航" onClick={() => setOpen(true)}><Menu size={20} /></button><div className="admin-breadcrumb"><span>工作台</span><ChevronRight size={13} aria-hidden="true" /><span>{current}</span></div><div className="admin-topbar-right"><span className="admin-timezone">UTC+8 · 上海</span><Link href="/">访问网站 <ArrowUpRight size={14} aria-hidden="true" /></Link></div></div>
      <main id="main-content" className="admin-sheet">{children}</main>
    </div>
  </div>;
}
