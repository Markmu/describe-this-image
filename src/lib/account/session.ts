import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BillingError } from "../billing/errors";
import { accountLoginUrl } from "./navigation";

export async function requireAccountPage(path: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(accountLoginUrl(path));
  return session.user.id;
}

export async function requireAccountApi() {
  const session = await auth();
  if (!session?.user?.id) throw new BillingError("LOGIN_REQUIRED", "Sign in to view your account.", 401);
  return session.user.id;
}
