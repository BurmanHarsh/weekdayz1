import { useCurrencyStore, formatInCurrency } from "./currency-store";

export function formatPrice(cents: number, currency?: string): string {
  const activeCurrency = (currency || useCurrencyStore.getState().currency) as any;
  return formatInCurrency(cents, activeCurrency);
}

/** Shorthand for INR display (e.g. ₹1,499) — used by wishlist, marquee, etc. */
export function rupees(cents: number): string {
  return formatInCurrency(cents, "INR");
}

/** Returns the discount percentage (rounded) between MRP and sale price. */
export function discountPct(mrpCents: number, priceCents: number): number {
  if (!mrpCents || mrpCents <= priceCents) return 0;
  return Math.round(((mrpCents - priceCents) / mrpCents) * 100);
}

