// Shared public product terms for pages, metadata and server-side billing.
export const CREDITS_PER_IMAGE = 10;
export const GUEST_FREE_CREDITS = CREDITS_PER_IMAGE;
export const ACCOUNT_WELCOME_CREDITS = 2 * CREDITS_PER_IMAGE;
export const STARTER_PRICE_CENTS = 699;
export const STARTER_CREDITS = 500;
export const STARTER_PRICE = `$${(STARTER_PRICE_CENTS / 100).toFixed(2)}`;
export const PRO_MONTH_PRICE_CENTS = 990;
export const PRO_YEAR_PRICE_CENTS = 7990;
export const PRO_MONTH_CREDITS = 2000;
export const PRO_YEAR_MONTHLY_CREDITS = 3000;
export const PRO_MONTH_PRICE = `$${(PRO_MONTH_PRICE_CENTS / 100).toFixed(2)}`;
export const PRO_YEAR_PRICE = `$${(PRO_YEAR_PRICE_CENTS / 100).toFixed(2)}`;
export const STARTER_IMAGES = STARTER_CREDITS / CREDITS_PER_IMAGE;
export const PRO_MONTH_IMAGES = PRO_MONTH_CREDITS / CREDITS_PER_IMAGE;
export const PRO_YEAR_MONTHLY_IMAGES = PRO_YEAR_MONTHLY_CREDITS / CREDITS_PER_IMAGE;
