export type AccountPage<T> = { items: T[]; nextCursor: string | null };

export type CreditSource = {
  id: string;
  label: string;
  kind: string;
  amount: number;
  remaining: number;
  expiresAt: string | null;
};

export type CreditSummary = {
  remaining: number;
  descriptions: number;
  sources: CreditSource[];
  nextWindow: { startsAt: string; amount: number } | null;
};

export type AccountSubscription = {
  name: string;
  interval: "monthly" | "yearly";
  status: string;
  statusLabel: string;
  hasAccess: boolean;
  paidThrough: string;
};

export type BillingSummary = {
  subscription: AccountSubscription | null;
  canOpenPortal: boolean;
  pendingOrders: { id: string; name: string; createdAt: string; amountCents: number; currency: string }[];
};

export type CreditActivity = {
  id: string;
  createdAt: string;
  label: string;
  detail: string;
  delta: number | null;
};

export type AccountPayment = {
  id: string;
  createdAt: string;
  name: string;
  status: "confirmed" | "reversed";
  periodStart: string | null;
  periodEnd: string | null;
  amountCents: number | null;
};
