import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";

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

/**
 * Creates a Razorpay Order on the backend.
 * The frontend will use this Order ID to display the checkout overlay.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        amount_cents: z.number().int().positive(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    try {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: data.amount_cents, // Razorpay takes amount in the smallest currency unit (paise)
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
 * Verifies Razorpay payment signature authenticity.
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

  return generatedSignature === razorpaySignature;
}
