"use client";

export function AdminTabs({ tabs, value, label, panelId, onChange }: { tabs: readonly (readonly [string, string])[]; value: string; label: string; panelId: string; onChange: (value: string) => void }) {
  return <div className="admin-tabs" role="tablist" aria-label={label} onKeyDown={event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex(([key]) => key === value);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[next]?.focus();
    onChange(tabs[next][0]);
  }}>{tabs.map(([key, title]) => <button key={key} id={`${panelId}-${key}`} role="tab" aria-selected={key === value} aria-controls={panelId} tabIndex={key === value ? 0 : -1} onClick={() => onChange(key)}>{title}</button>)}</div>;
}
