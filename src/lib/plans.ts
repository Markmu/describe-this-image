// Shared public product terms for pages, metadata and server-side billing.
export const GUEST_FREE_CREDITS = 1;
export const ACCOUNT_WELCOME_CREDITS = 2;
export const STARTER_PRICE_CENTS = 699;
export const STARTER_CREDITS = 300;
export const STARTER_PRICE = `$${(STARTER_PRICE_CENTS / 100).toFixed(2)}`;
export const STARTER_UNIT_COST = `$${(STARTER_PRICE_CENTS / 100 / STARTER_CREDITS).toFixed(3)}`;
