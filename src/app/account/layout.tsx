import type { Metadata } from "next";
import "./account.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content" className="account-page">{children}</main>;
}
