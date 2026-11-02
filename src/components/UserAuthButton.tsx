'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
export function UserAuthButton() {
  const {data:session,status} = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open,setOpen] = useState(false);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
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
        if (pathname !== "/billing/login") { router.push("/billing/login?error=Configuration");return; }
        throw new Error("Google login is not configured. Please contact the site owner.");
      }
      await signIn("google",{redirectTo:pathname === "/billing/login" ? "/pricing" : pathname});
    } catch { setError("Google login is unavailable. Please try again later."); }
    finally { busyRef.current=false;setBusy(false); }
  }
  async function portal() {
    if (busyRef.current) return;
    busyRef.current=true;setBusy(true);setError("");
    try {
      const response = await fetch("/api/billing/portal",{method:"POST",signal:AbortSignal.timeout(15000)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Billing is unavailable.");
      window.location.assign(data.url);
    } catch (error) { setError(error instanceof Error ? error.message : "Billing is unavailable."); }
    finally {busyRef.current=false;setBusy(false);}
  }
  if (status === "loading") return <span className="text-xs text-zinc-500" role="status">Loading account…</span>;
  if (!session?.user) return <div>
    <button onClick={login} disabled={busy} className="min-h-11 rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50">{busy ? "Connecting…" : "Sign in with Google"}</button>
    {error && <p role="alert" className="mt-3 max-w-xs text-sm text-red-700">{error}</p>}
  </div>;
  return <div ref={root} className="relative" onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}
    onKeyDown={event => {if (event.key === "Escape") {setOpen(false);trigger.current?.focus();}}}>
    <button ref={trigger} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}
      className="min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-semibold">Account</button>
    {open && <div id={id} className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-xl space-y-3">
      <p className="truncate font-semibold">{session.user.name || "Your account"}</p>
      <p className="truncate text-xs text-zinc-500">{session.user.email}</p>
      <Link href="/pricing" className="block py-2 underline">Plans and credits</Link>
      <button onClick={portal} disabled={busy} className="block min-h-11 text-blue-700 font-medium">{busy ? "Opening…" : "Manage billing"}</button>
      <button onClick={() => void signOut({redirectTo:"/"})} className="block min-h-11 text-red-700">Sign out</button>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>}
  </div>;
}
