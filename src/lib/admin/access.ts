import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { HttpError } from "../http";
import { isAdminUser } from "./identity";

export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401, "Sign in to open administration.", "LOGIN_REQUIRED");
  if (!isAdminUser(session.user.id)) throw new HttpError(403, "Administrator access is required.", "ADMIN_REQUIRED");
  return session.user.id;
}

export async function requireAdminPage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/billing/login?returnTo=%2Fadmin");
  if (!isAdminUser(session.user.id)) notFound();
  return { id: session.user.id, email: session.user.email ?? session.user.id };
}
