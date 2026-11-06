import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { hasAuthConfiguration } from "./auth.configuration";
import { recordLogin } from "./lib/admin/identity";

const instance = NextAuth({
  ...authConfig,
  callbacks: {
    signIn({ account, profile }) {
      return hasAuthConfiguration() && account?.provider === "google"
        && profile?.email_verified === true && typeof profile.sub === "string";
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub) {
        token.id = `google:${profile.sub}`;
        await recordLogin(token.id as string, typeof profile.email === "string" ? profile.email : null, token.name);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
});

// Refuse to read or mint sessions using the former public development secret.
export async function auth() {
  return hasAuthConfiguration() ? instance.auth() : null;
}
export const handlers = instance.handlers;
