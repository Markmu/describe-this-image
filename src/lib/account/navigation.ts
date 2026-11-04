export function accountReturnPath(value?: string | null) {
  return value === "/account/plans" || value === "/account/billing" ? value : "/pricing";
}

export function accountLoginUrl(path: string) {
  return `/billing/login?returnTo=${encodeURIComponent(accountReturnPath(path))}`;
}
