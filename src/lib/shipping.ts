/**
 * Shipping utility placeholders.
 *
 * TODO: Wire these to a real shipping API (Shiprocket, FedEx, EasyPost).
 * The function signatures are stable so swapping the implementation
 * shouldn't ripple through the codebase.
 */

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Calculate shipping cost (in cents) for an address.
 * Replace this with an API call to Shiprocket / FedEx / EasyPost when ready.
 */
export function calculateShippingCost(address: ShippingAddress): number {
  // Flat 99 INR domestic, 999 INR international as a placeholder.
  const country = address.country?.toUpperCase() || "IN";
  return country === "IN" ? 9900 : 99900;
}

/**
 * Generate a tracking ID. Real integrations should request this from the
 * carrier after creating the shipment.
 */
export function generateTrackingId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WKZ-${ts}-${rand}`;
}
