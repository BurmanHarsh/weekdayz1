import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";
import { checkRateLimit } from "./rate-limiter";

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay API credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET).");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

const CreateRazorpayOrderSchema = z.object({
  amount_cents: z.number().int().positive().max(100000000), // Max ₹10,00,000 safety boundary
  items: z
    .array(
      z.object({
        product_id: z.string().uuid().nullable().optional(),
        quantity: z.number().int().positive().max(100),
        unit_price_cents: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

/**
 * Creates a Razorpay Order on the backend with rate-limiting & price verification.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => CreateRazorpayOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Rate Limiting: Max 100 order initiation attempts per 60 seconds per user
    checkRateLimit(
      `razorpay_order_${context.userId}`,
      100,
      60 * 1000,
      "Too many payment initialization attempts. Please wait a minute before trying again."
    );

    // 2. Server-side price validation if items are passed
    if (data.items && data.items.length > 0) {
      const dbProductIds = data.items.map((i) => i.product_id).filter(Boolean) as string[];
      if (dbProductIds.length > 0) {
        const { data: dbProds } = await context.supabase
          .from("products")
          .select("id, price_cents")
          .in("id", dbProductIds);
        
        const priceMap = new Map((dbProds ?? []).map((p) => [p.id, p.price_cents]));

        for (const item of data.items) {
          if (item.product_id && priceMap.has(item.product_id)) {
            const expectedPrice = priceMap.get(item.product_id)!;
            if (item.unit_price_cents !== expectedPrice) {
              throw new Error("Security Alert: Product price discrepancy detected. Payment initialization rejected.");
            }
          }
        }
      }
    }

    try {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: data.amount_cents, // Razorpay amount in paise
        currency: "INR",
        receipt: `receipt_${crypto.randomUUID().slice(0, 10)}`,
      };

      const order = await razorpay.orders.create(options);
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to initiate Razorpay order");
    }
  });

/**
 * Verifies Razorpay payment signature authenticity using timing-safe comparison.
 */
export function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET environment variable");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf-8"),
      Buffer.from(razorpaySignature, "utf-8")
    );
  } catch (_) {
    return false;
  }
}
