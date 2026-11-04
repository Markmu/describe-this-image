import { STARTER_CREDITS, STARTER_PRICE, STARTER_PRICE_CENTS, PRO_MONTH_PRICE, PRO_MONTH_PRICE_CENTS, PRO_YEAR_PRICE, PRO_YEAR_PRICE_CENTS, PRO_MONTH_CREDITS, PRO_YEAR_MONTHLY_CREDITS } from "../plans";

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

export type ActiveOfferId = Exclude<PlanOffer["id"], "addon-1000">;

export const PLAN_OFFERS: Record<ActiveOfferId, PlanOffer> = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    priceFormatted: STARTER_PRICE,
    amountCents: STARTER_PRICE_CENTS,
    billingType: "onetime",
    credits: STARTER_CREDITS,
    creditsLabel: `${STARTER_CREDITS} non-expiring credits`,
    description: "One-time purchase, credits never expire.",
  },
  "pro-month": {
    id: "pro-month",
    name: "Pro Monthly",
    priceFormatted: `${PRO_MONTH_PRICE} / mo`,
    amountCents: PRO_MONTH_PRICE_CENTS,
    billingType: "recurring",
    billingPeriod: "monthly",
    credits: PRO_MONTH_CREDITS,
    creditsLabel: "2,000 credits / month",
    description: "Monthly subscription with batch processing & CSV export.",
  },
  "pro-year": {
    id: "pro-year",
    name: "Pro Annual",
    priceFormatted: `${PRO_YEAR_PRICE} / yr`,
    amountCents: PRO_YEAR_PRICE_CENTS,
    billingType: "recurring",
    billingPeriod: "yearly",
    credits: PRO_YEAR_MONTHLY_CREDITS,
    creditsLabel: "3,000 credits / month (36,000/yr)",
    description: "Annual subscription with 300 image descriptions per month.",
  },
};

// Retired products remain available to reconcile existing orders and reversals.
const RETIRED_OFFERS: Record<string, PlanOffer> = {
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

export function getOrderOffer(id: string): PlanOffer | undefined {
  if (Object.hasOwn(PLAN_OFFERS, id)) return PLAN_OFFERS[id as ActiveOfferId];
  return Object.hasOwn(RETIRED_OFFERS, id) ? RETIRED_OFFERS[id] : undefined;
}
