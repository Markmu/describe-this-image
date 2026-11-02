import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { UserAuthButton } from "@/components/UserAuthButton";
import { hasAuthConfiguration } from "@/auth.configuration";
export const metadata = { title:"Sign in", robots:{index:false,follow:false} };
async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection();
  const { error } = await searchParams;
  return <>
    <h1 className="text-3xl font-semibold">Sign in with Google</h1>
    <p className="text-zinc-600">{!hasAuthConfiguration() ? "Google login is not configured. Please contact the site owner."
      : error ? "Google sign-in could not be completed. Please try again."
      : "Sign in to access your daily credits and purchases."}</p>
    <UserAuthButton />
    <Link href="/pricing" className="block underline">Return to pricing</Link>
  </>;
}
export default function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  return <main id="main-content" className="mx-auto w-full max-w-lg px-6 py-24 space-y-6"><Suspense fallback={<p>Loading sign-in…</p>}><LoginContent {...props} /></Suspense></main>;
}
