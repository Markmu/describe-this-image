import type { ReactNode } from "react";

export function PageIntro({ title, children, compact = false }: {
  title: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return <header className={`page-intro${compact ? " page-intro-compact" : ""}`}>
    <div className="page-intro-grid">
      <h1>{title}</h1>
      <div className="page-intro-copy">{children}</div>
    </div>
  </header>;
}
