import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendOrderConfirmation } from "./email";
import { verifySignature } from "./razorpay.functions";
import { decrementFallbackInventory } from "./fallback-data";

import { checkRateLimit } from "./rate-limiter";
import { sanitizeInput } from "./security";

const OrderItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  custom_design_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive().max(100),
  size: z.string().min(1).max(20),
  color: z.string().max(50).nullable().optional(),
  unit_price_cents: z.number().int().nonnegative().max(10000000),
  title_snapshot: z.string().max(200).default(""),
  image_snapshot: z.string().max(1000).nullable().optional(),
});

const ShippingDetailsSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postal_code: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default("India"),
});

const PlaceOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(50),
  total_cents: z.number().int().nonnegative().max(100000000),
  shipping_details: ShippingDetailsSchema.passthrough(),
  razorpay_order_id: z.string().min(5).max(100),
  razorpay_payment_id: z.string().min(5).max(100),
  razorpay_signature: z.string().min(10).max(255),
});

export async function internalPlaceOrder(supabase: any, userId: string, data: any) {
    // 1. Insert order record into database
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: data.total_cents,
        payment_status: "paid",
        fulfillment_status: "processing",
        shipping_details: data.shipping_details as any,
      })
      .select("id")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Failed to create order in database");

    // 2. Insert order items
    const items = data.items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id ?? null,
      custom_design_id: i.custom_design_id ?? null,
      quantity: i.quantity,
      size: i.size,
      color: i.color ?? null,
      unit_price_cents: i.unit_price_cents,
      title_snapshot: i.title_snapshot,
      image_snapshot: i.image_snapshot ?? null,
    }));

    let { error: itemsErr } = await supabase.from("order_items").insert(items);

    // Fallback if Supabase database schema does not have 'color' column yet
    if (itemsErr && (itemsErr.message.includes("color") || itemsErr.code === "PGRST204")) {
      const legacyItems = items.map(({ color, ...rest }) => rest);
      const retryRes = await supabase.from("order_items").insert(legacyItems);
      itemsErr = retryRes.error;
    }

    if (itemsErr) throw new Error(itemsErr.message);

    // 3. Atomically decrement inventory for each product in the order
    const productItems = data.items.filter((i: any) => i.product_id);
    await Promise.all(
      productItems.map(async (i: any) => {
        if (!i.product_id) return;
        try {
          const { error: rpcErr } = await supabase.rpc("decrement_inventory", {
            p_product_id: i.product_id as string,
            p_qty: i.quantity,
          });

          if (rpcErr) {
            const { data: prod } = await supabase
              .from("products")
              .select("inventory_count")
              .eq("id", i.product_id)
              .maybeSingle();

            if (prod) {
              const updatedCount = Math.max(0, (prod.inventory_count ?? 0) - i.quantity);
              await supabase
                .from("products")
                .update({ inventory_count: updatedCount })
                .eq("id", i.product_id);
            }
          }
        } catch (_) {}

        decrementFallbackInventory(i.product_id, i.quantity);
      })
    );

    // 4. Set estimated delivery date (DTDC standard: 5–7 business days)
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    await supabase
      .from("orders")
      .update({
        estimated_delivery_date: estimatedDelivery.toISOString(),
      })
      .eq("id", order.id);

    // 5. Trigger transactional email
    const shippingDetails = data.shipping_details as Record<string, string>;
    const email = shippingDetails.email;
    if (email) {
      sendOrderConfirmation(email, order.id, data.total_cents, estimatedDelivery.toISOString()).catch(
        (err) => console.error("Email delivery failed:", err)
      );
    }

    return { id: order.id };
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => PlaceOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 0. Rate limiting: max 100 order placements per minute per user
    checkRateLimit(
      `place_order_${userId}`,
      100,
      60 * 1000,
      "Order placement rate limit reached. Please wait a moment before trying again."
    );

    // 1. Verify Razorpay Payment Signature
    const isPaymentVerified = verifySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature
    );

    if (!isPaymentVerified) {
      throw new Error("Security Alert: Payment signature verification failed. Order placement aborted.");
    }

    // 1b. Server-side validation of product prices against DB
    const dbProductIds = data.items.map((i) => i.product_id).filter(Boolean) as string[];
    if (dbProductIds.length > 0) {
      const { data: dbProds } = await supabase
        .from("products")
        .select("id, price_cents")
        .in("id", dbProductIds);
      const priceMap = new Map((dbProds ?? []).map((p) => [p.id, p.price_cents]));

      for (const item of data.items) {
        if (item.product_id && priceMap.has(item.product_id)) {
          const expectedPrice = priceMap.get(item.product_id)!;
          if (item.unit_price_cents !== expectedPrice) {
            throw new Error(`Security Alert: Price mismatch detected for product. Order rejected.`);
          }
        }
      }
    }

    return await internalPlaceOrder(supabase, userId, data);
  });

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, payment_status, fulfillment_status, created_at, tracking_number, estimated_delivery_date, order_items(id, product_id, title_snapshot, image_snapshot, quantity, size, color, unit_price_cents)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Enrich order items with product slugs for linking
    const productIds = new Set<string>();
    for (const order of data ?? []) {
      for (const item of (order as any).order_items ?? []) {
        if (item.product_id) productIds.add(item.product_id);
      }
    }

    let slugMap: Record<string, string> = {};
    if (productIds.size > 0) {
      try {
        const { data: products } = await context.supabase
          .from("products")
          .select("id, slug")
          .in("id", Array.from(productIds));
        if (products) {
          slugMap = Object.fromEntries(products.map((p) => [p.id, p.slug]));
        }
      } catch (_) {}
    }

    return (data ?? []).map((order: any) => ({
      ...order,
      order_items: (order.order_items ?? []).map((item: any) => ({
        ...item,
        product_slug: slugMap[item.product_id] ?? null,
      })),
    }));
  });
