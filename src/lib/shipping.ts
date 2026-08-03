import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
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

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

async function getShiprocketToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return null;
  }

  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const res = await fetch("https://apiv2.shiprocket.in/v2/crypto/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.error("Shiprocket authentication failed:", await res.text());
      return null;
    }

    const json = await res.json();
    shiprocketToken = json.token;
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days expiration
    return shiprocketToken;
  } catch (error) {
    console.error("Shiprocket authentication error:", error);
    return null;
  }
}

/**
 * Format date like Amazon: "Arrives by Wednesday, 22nd July"
 */
export function formatEstimatedDeliveryDate(etdString: string | null): string {
  const date = etdString ? new Date(etdString) : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
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
 * Sync signature function for static UI fallback
 */
export function calculateShippingCost(address: ShippingAddress): number {
  const country = address.country?.toUpperCase() || "IN";
  return country === "IN" ? 9900 : 99900;
}

export function generateTrackingId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WKZ-${ts}-${rand}`;
}

/**
 * Calculate live shipping details based on database weights/dimensions and Shiprocket API
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

    // Standard fallback settings
    let finalCostCents = isDomestic ? 9900 : 99900;
    let etd: string | null = null;

    try {
      // 1. Resolve product weights and dimensions from Supabase
      const productIds = data.items.map((i) => i.product_id).filter(Boolean) as string[];
      let totalWeight = 0;
      let maxLength = 0;
      let maxWidth = 0;
      let maxHeight = 0;

      if (productIds.length > 0) {
        const supabase = getPublicClient();
        const { data: dbProducts } = await supabase
          .from("products")
          .select("id, weight_g, length_cm, width_cm, height_cm")
          .in("id", productIds);

        const productMap = new Map(dbProducts?.map((p) => [p.id, p]) ?? []);

        data.items.forEach((item) => {
          const prod = item.product_id ? productMap.get(item.product_id) : null;
          // default values: 300g per item
          const weightG = (prod?.weight_g ?? 300) * item.quantity;
          totalWeight += weightG;
          maxLength = Math.max(maxLength, prod?.length_cm ? Number(prod.length_cm) : 30);
          maxWidth = Math.max(maxWidth, prod?.width_cm ? Number(prod.width_cm) : 20);
          // stack heights
          maxHeight += (prod?.height_cm ? Number(prod.height_cm) : 3) * item.quantity;
        });
      } else {
        // Fallback for custom graphic uploads (no associated products)
        data.items.forEach((item) => {
          totalWeight += 300 * item.quantity;
          maxLength = Math.max(maxLength, 30);
          maxWidth = Math.max(maxWidth, 20);
          maxHeight += 3 * item.quantity;
        });
      }

      // Convert to Shiprocket expected units
      const totalWeightKg = totalWeight / 1000;

      // 2. Fetch live rate from Shiprocket API
      const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE || "560001";
      const token = await getShiprocketToken();

      if (token && isDomestic) {
        const url = new URL("https://apiv2.shiprocket.in/v2/crypto/shipments/realtime-rate");
        url.searchParams.append("pickup_postcode", pickupPostcode);
        url.searchParams.append("delivery_postcode", destPincode);
        url.searchParams.append("weight", totalWeightKg.toString());
        url.searchParams.append("cod", "0");
        url.searchParams.append("length", maxLength.toString());
        url.searchParams.append("width", maxWidth.toString());
        url.searchParams.append("height", maxHeight.toString());

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const rateData = await res.json();
          const couriers = rateData?.data?.available_courier_companies;
          if (couriers && couriers.length > 0) {
            let bestCourier = couriers[0];
            for (const c of couriers) {
              if (Number(c.rate) < Number(bestCourier.rate)) {
                bestCourier = c;
              }
            }
            finalCostCents = Math.round(Number(bestCourier.rate) * 100);
            etd = bestCourier.etd || null;
          }
        }
      }
    } catch (e) {
      console.warn("Failed fetching live Shiprocket rates, using fallback standard rate:", e);
    }

    return {
      shipping_cost_cents: finalCostCents,
      estimated_delivery_date: etd,
      formatted_delivery_date: formatEstimatedDeliveryDate(etd),
    };
  });

/**
 * Checks address validation and courier serviceability using postalpincode.in and Shiprocket.
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
  .handler(async ({ data }) => {
    const { postal_code, country } = data;
    const isDomestic = country.toUpperCase() === "IN";

    // 1. If domestic (India), first validate Pincode using postalpincode.in API
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
              // Pincode is valid! Let's check Shiprocket serviceability now if credentials are set
              const token = await getShiprocketToken();
              if (token) {
                try {
                  const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE || "560001";
                  const url = new URL("https://apiv2.shiprocket.in/v1/external/courier/serviceability/");
                  url.searchParams.append("pickup_postcode", pickupPostcode);
                  url.searchParams.append("delivery_postcode", postal_code);
                  url.searchParams.append("weight", "0.5");
                  url.searchParams.append("cod", "0");

                  const res = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });

                  if (res.ok) {
                    const serviceabilityData = await res.json();
                    const availableCouriers = serviceabilityData?.data?.available_courier_companies;
                    const isServiceable = serviceabilityData?.status === 200 && availableCouriers && availableCouriers.length > 0;
                    if (!isServiceable) {
                      return {
                        valid: true,
                        serviceable: false,
                        city: info.District || info.Division,
                        state: info.State,
                        area: info.Name,
                        error: "This location is currently not serviceable by our delivery partners.",
                      };
                    }
                  }
                } catch (err) {
                  console.error("Error checking Shiprocket serviceability:", err);
                }
              }

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

    // Default return for international or when API fails / Shiprocket token is missing
    return {
      valid: true,
      serviceable: true,
    };
  });

/**
 * Handles creation of orders inside Shiprocket panel.
 */
export async function createShiprocketOrder(params: {
  orderId: string;
  address: ShippingAddress;
  totalCents: number;
  items: Array<{ title: string; color?: string; quantity: number; unitPriceCents: number }>;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}): Promise<{ shiprocketOrderId: string; shiprocketShipmentId: string } | null> {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
    const payload = {
      order_id: params.orderId,
      order_date: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
      pickup_location: pickupLocation,
      billing_customer_name: params.address.full_name.split(" ")[0] || "Customer",
      billing_last_name: params.address.full_name.split(" ").slice(1).join(" ") || "Name",
      billing_address: params.address.line1,
      billing_address_2: params.address.line2 || "",
      billing_city: params.address.city,
      billing_pincode: params.address.postal_code,
      billing_state: params.address.state,
      billing_country: params.address.country || "India",
      billing_email: params.address.email,
      billing_phone: params.address.phone,
      shipping_is_billing: true,
      order_items: params.items.map((it) => ({
        name: it.color ? `${it.title} (${it.color})` : it.title,
        sku: `${it.title}${it.color ? `-${it.color}` : ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        units: it.quantity,
        selling_price: it.unitPriceCents / 100,
      })),
      payment_method: "Prepaid",
      sub_total: params.totalCents / 100,
      length: params.lengthCm,
      width: params.widthCm,
      height: params.heightCm,
      weight: params.weightKg,
    };

    const res = await fetch("https://apiv2.shiprocket.in/v2/crypto/orders/create/adhoc", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Failed to create adhoc order in Shiprocket:", await res.text());
      return null;
    }

    const data = await res.json();
    return {
      shiprocketOrderId: String(data.order_id),
      shiprocketShipmentId: String(data.shipment_id),
    };
  } catch (error) {
    console.error("Error creating Shiprocket order:", error);
    return null;
  }
}
