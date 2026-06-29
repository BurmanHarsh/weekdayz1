export function formatPrice(cents: number, currency = "INR"): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value.toFixed(0)}`;
  }
}
