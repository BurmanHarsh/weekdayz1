import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "INR" | "USD" | "EUR";

interface CurrencyStore {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: "INR",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "weekdayz-currency" }
  )
);

/**
 * Exchange rates relative to INR (approximate static rates).
 * In production, fetch from an FX API.
 */
const RATES: Record<Currency, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
};

const LOCALES: Record<Currency, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
};

/**
 * Format a price given in INR paise (e.g., 189900 = ₹1,899)
 * into the target currency string.
 */
export function formatInCurrency(centsInr: number, currency: Currency): string {
  const inrValue = centsInr / 100;
  const converted = inrValue * RATES[currency];
  try {
    return new Intl.NumberFormat(
      LOCALES[currency],
      { style: "currency", currency, maximumFractionDigits: currency === "INR" ? 0 : 2 }
    ).format(converted);
  } catch {
    return `${converted.toFixed(currency === "INR" ? 0 : 2)}`;
  }
}
