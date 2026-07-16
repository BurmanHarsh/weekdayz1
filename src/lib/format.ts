import { useCurrencyStore, formatInCurrency } from "./currency-store";

export function formatPrice(cents: number, currency?: string): string {
  const activeCurrency = (currency || useCurrencyStore.getState().currency) as any;
  return formatInCurrency(cents, activeCurrency);
}
