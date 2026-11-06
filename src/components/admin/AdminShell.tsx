"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Aperture, ChartNoAxesCombined, Users, Receipt, Coins, ScanLine, Settings2, ClipboardList, ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  ["/admin", "运营概览", ChartNoAxesCombined], ["/admin/users", "用户管理", Users],
  ["/admin/billing", "订单与订阅", Receipt], ["/admin/credits", "积分与补偿", Coins],
  ["/admin/requests", "生成与审核", ScanLine], ["/admin/operations", "系统与任务", Settings2],
  ["/admin/audit", "操作日志", ClipboardList],
] as const;

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <div className="admin-console" lang="zh-CN" onKeyDown={event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>
    <aside className="admin-sidebar" id="admin-navigation" data-open={open}>
      <Link href="/admin" className="admin-wordmark" onClick={() => setOpen(false)}><Aperture size={27} aria-hidden="true" /><span>Describe<br />this image.</span></Link>
      <p className="admin-scope">管理工作台</p>
      <nav aria-label="管理后台导航">{links.map(([href, label, Icon]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} aria-hidden="true" />{label}</Link>)}</nav>
      <div className="admin-sidebar-bottom"><Link href="/">访问网站 <ArrowUpRight size={15} aria-hidden="true" /></Link><span>站长账户</span><p title={email}>{email}</p><button onClick={()=>signOut({redirectTo:"/"})}>退出登录</button></div>
    </aside>
    <div className="admin-frame">
      <div className="admin-topbar"><button ref={trigger} className="admin-menu" aria-expanded={open} aria-controls="admin-navigation" aria-label={open ? "关闭导航" : "打开导航"} onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />}</button><span>Describe This Image <span className="admin-muted">/ 运营</span></span><span className="admin-timezone">Asia/Shanghai · UTC+8</span></div>
      <main id="main-content" className="admin-sheet">{children}</main>
    </div>
  </div>;
}
