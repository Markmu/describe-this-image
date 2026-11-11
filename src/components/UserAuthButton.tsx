'use client';
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, CreditCard, History, LogOut, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import { accountReturnPath } from "@/lib/account/navigation";

function AccountAvatar({ name, image }: { name: string; image?: string | null }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase() || "A";

  return <span className="account-avatar" aria-hidden="true">
    {image && image !== failedImage
      ? <Image src={image} alt="" width={40} height={40} unoptimized referrerPolicy="no-referrer" onError={() => setFailedImage(image)} />
      : initials}
  </span>;
}

export function UserAuthButton({ returnTo }: { returnTo?: string } = {}) {
  const {data:session,status} = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open,setOpen] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [signingOut,setSigningOut] = useState(false);
  const busyRef = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown",outside);
    return () => document.removeEventListener("pointerdown",outside);
  },[open]);
  async function login() {
    if (busyRef.current) return;
    busyRef.current=true;setBusy(true);setError("");
    try {
      const response = await fetch("/api/auth/config",{cache:"no-store",signal:AbortSignal.timeout(10000)});
      if (!response.ok || !(await response.json()).configured) {
        if (pathname !== "/billing/login") { router.push("/billing/login?error=Configuration&returnTo="+encodeURIComponent(accountReturnPath(pathname)));return; }
        throw new Error("Google login is not configured. Please contact the site owner.");
      }
      await signIn("google",{redirectTo:pathname === "/billing/login"
        ? accountReturnPath(returnTo ?? new URLSearchParams(window.location.search).get("returnTo")) : pathname});
    } catch { setError("Google login is unavailable. Please try again later."); }
    finally { busyRef.current=false;setBusy(false); }
  }
  async function logout() {
    if (busyRef.current) return;
    busyRef.current=true;setSigningOut(true);setError("");
    try { await signOut({redirectTo:"/"}); }
    catch { setError("Sign out failed. Please try again."); }
    finally {busyRef.current=false;setSigningOut(false);}
  }
  if (status === "loading") return <span className="text-xs text-zinc-500" role="status">Loading account…</span>;
  if (!session?.user) return <div>
    <button onClick={login} disabled={busy} className="min-h-11 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50">{busy ? "Connecting…" : "Sign in with Google"}</button>
    {error && <p role="alert" className="mt-3 max-w-xs text-sm text-red-700">{error}</p>}
  </div>;
  const name = session.user.name || "Your account";
  return <div ref={root} className="account-menu" onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}
    onKeyDown={event => {if (event.key === "Escape" && open) {event.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}
      className="account-trigger">
      <AccountAvatar name={name} image={session.user.image} />
      <span className="max-w-40 truncate" title={name}>{name}</span><ChevronDown size={14} aria-hidden="true" className="account-chevron" />
    </button>
    {open && <div id={id} className="account-popover" role="region" aria-label="Account options">
      <div className="account-identity">
        <AccountAvatar name={name} image={session.user.image} />
        <div><p className="account-name" title={name}>{name}</p>
          {session.user.email && <p className="account-email" title={session.user.email}>{session.user.email}</p>}</div>
      </div>
      <div className="account-actions" role="group" aria-label="Plans and billing">
        <Link href="/account/history" prefetch={false} className="account-action" onClick={() => setOpen(false)}>
          <History size={18} aria-hidden="true" /><span>Description history</span><ArrowUpRight size={15} aria-hidden="true" className="account-action-trailing" />
        </Link>
        <Link href="/account/plans" prefetch={false} className="account-action" onClick={() => setOpen(false)}>
          <Wallet size={18} aria-hidden="true" /><span>Plans and credits</span><ArrowUpRight size={15} aria-hidden="true" className="account-action-trailing" />
        </Link>
        <Link href="/account/billing" prefetch={false} className="account-action" onClick={() => setOpen(false)}>
          <CreditCard size={18} aria-hidden="true" /><span>Manage billing</span><ArrowUpRight size={15} aria-hidden="true" className="account-action-trailing" />
        </Link>
      </div>
      <div className="account-signout">
        <button type="button" onClick={logout} aria-disabled={busy || signingOut} className="account-action" aria-busy={signingOut}>
          <LogOut size={18} aria-hidden="true" /><span>{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      </div>
      {error && <p role="alert" className="account-error">{error}</p>}
    </div>}
  </div>;
}
