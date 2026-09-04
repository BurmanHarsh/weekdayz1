import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPublicClient } from "@/lib/supabase-server";

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

/** Pickup pincode — Weekdayzz warehouse (Lucknow) */
const PICKUP_PINCODE = "226023";

/**
 * DTDC tracking URL builder.
 * Customers can paste this link to track their DTDC consignment.
 */
export function getDtdcTrackingUrl(trackingId: string): string {
  return `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${encodeURIComponent(trackingId)}`;
}

/**
 * Format date like Amazon: "Arrives by Wednesday, 22nd July"
 */
export function formatEstimatedDeliveryDate(etdString: string | null): string {
  const date = etdString ? new Date(etdString) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const dayName = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date);
  const day = date.getDate();
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date);

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `Arrives by ${dayName}, ${day}${suffix} ${monthName}`;
}

/**
 * Flat-rate DTDC shipping cost.
 * Domestic (India): ₹99 flat | International: ₹999
 */
export function calculateShippingCost(address: ShippingAddress): number {
  const country = address.country?.toUpperCase() || "IN";
  return country === "IN" ? 9900 : 99900;
}

/**
 * Estimate delivery window based on destination zone.
 * Same state: 3–4 days, Adjacent/Metro: 4–5 days, Rest of India: 5–7 days
 */
function estimateDeliveryDays(destPincode: string): number {
  const pickupZone = PICKUP_PINCODE.charAt(0); // "2" (UP zone)
  const destZone = destPincode.charAt(0);

  if (destZone === pickupZone) return 4; // Same zone (UP, Uttarakhand, etc.)
  if (["1", "3"].includes(destZone)) return 5; // Adjacent zones (Delhi, Rajasthan, Gujarat)
  return 6; // Rest of India
}

/**
 * Server function: Get live shipping details (cost + estimated delivery).
 * Uses flat DTDC rates since booking is manual via MyDTDC.in portal.
 */
export const getLiveShippingDetails = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        address: z.any(),
        items: z.array(
          z.object({
            product_id: z.string().uuid().nullable().optional(),
            quantity: z.number().int().positive(),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const address = data.address as ShippingAddress;
    const isDomestic = (address.country?.toUpperCase() || "IN") === "IN";
    const destPincode = address.postal_code;

    const finalCostCents = isDomestic ? 9900 : 99900;

    // Estimate delivery date based on zone distance
    const deliveryDays = isDomestic ? estimateDeliveryDays(destPincode) : 14;
    const etdDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    const etd = etdDate.toISOString();

    return {
      shipping_cost_cents: finalCostCents,
      estimated_delivery_date: etd,
      formatted_delivery_date: formatEstimatedDeliveryDate(etd),
    };
  });

export interface ServiceabilityResult {
  valid: boolean;
  serviceable: boolean;
  city?: string;
  state?: string;
  area?: string;
  details?: string;
  error?: string;
}

/**
 * Server function: Check if a pincode is valid and serviceable via DTDC.
 * Uses India Post pincode API for validation. DTDC covers all major Indian pincodes.
 */
export const checkAddressServiceability = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        postal_code: z.string().min(3),
        country: z.string().min(2),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<ServiceabilityResult> => {
    const { postal_code, country } = data;
    const isDomestic = country.toUpperCase() === "IN";

    if (isDomestic) {
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${postal_code}`);
        if (pinRes.ok) {
          const pinData = await pinRes.json();
          if (pinData && pinData[0]) {
            if (pinData[0].Status === "Error") {
              return {
                valid: false,
                serviceable: false,
                error: pinData[0].Message || "Invalid Indian postal pincode.",
              };
            }
            const postOffices = pinData[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const info = postOffices[0];
              return {
                valid: true,
                serviceable: true,
                city: info.District || info.Division,
                state: info.State,
                area: info.Name,
                details: `Pincode belongs to ${info.Name}, ${info.District}, ${info.State}`,
              };
            }
          }
          return {
            valid: false,
            serviceable: false,
            error: "Invalid Indian postal pincode.",
          };
        }
      } catch (err) {
        console.error("Error validating pincode via postalpincode.in:", err);
      }
    }

    // Default return for international or when India Post API fails
    return {
      valid: true,
      serviceable: true,
    };
  });
