export interface PlanOffer {
  id: "starter" | "pro-month" | "pro-year" | "addon-1000";
  name: string;
  priceFormatted: string;
  amountCents: number;
  billingType: "onetime" | "recurring";
  billingPeriod?: "monthly" | "yearly";
  credits: number;
  creditsLabel: string;
  description: string;
}

export const PLAN_OFFERS: Record<string, PlanOffer> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    priceFormatted: "$9.99",
    amountCents: 999,
    billingType: "onetime",
    credits: 300,
    creditsLabel: "300 non-expiring credits",
    description: "One-time purchase, credits never expire.",
  },
  "pro-month": {
    id: "pro-month",
    name: "Pro Monthly",
    priceFormatted: "$9.90 / mo",
    amountCents: 990,
    billingType: "recurring",
    billingPeriod: "monthly",
    credits: 2000,
    creditsLabel: "2,000 credits / month",
    description: "Monthly subscription with batch processing & CSV export.",
  },
  "pro-year": {
    id: "pro-year",
    name: "Pro Annual",
    priceFormatted: "$49.90 / yr",
    amountCents: 4990,
    billingType: "recurring",
    billingPeriod: "yearly",
    credits: 2000,
    creditsLabel: "2,000 credits / month (24,000/yr)",
    description: "Annual subscription (~5 months fee, save 58%).",
  },
  "addon-1000": {
    id: "addon-1000",
    name: "Add-on Credits (1,000)",
    priceFormatted: "$5.00",
    amountCents: 500,
    billingType: "onetime",
    credits: 1000,
    creditsLabel: "1,000 non-expiring credits ($0.005/ea)",
    description: "On-demand extra credits for high-volume batches.",
  },
};
