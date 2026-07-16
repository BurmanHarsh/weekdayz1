import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendOrderConfirmation } from "./email";

const OrderItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  custom_design_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  size: z.string().min(1),
  unit_price_cents: z.number().int().nonnegative(),
  title_snapshot: z.string().default(""),
  image_snapshot: z.string().nullable().optional(),
});

const PlaceOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  total_cents: z.number().int().nonnegative(),
  shipping_details: z.record(z.any()),
  // Placeholder — real payments would attach a Stripe/Razorpay intent ID here.
  payment_intent_id: z.string().optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => PlaceOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: data.total_cents,
        payment_status: "paid", // mock payment succeeded
        fulfillment_status: "processing",
        shipping_details: data.shipping_details,
      })
      .select("id")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Failed to create order");

    const items = data.items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id ?? null,
      custom_design_id: i.custom_design_id ?? null,
      quantity: i.quantity,
      size: i.size,
      unit_price_cents: i.unit_price_cents,
      title_snapshot: i.title_snapshot,
      image_snapshot: i.image_snapshot ?? null,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) throw new Error(itemsErr.message);

    // Atomically decrement inventory for each product in the order
    const productItems = data.items.filter((i) => i.product_id);
    await Promise.all(
      productItems.map((i) =>
        supabase.rpc("decrement_inventory", {
          p_product_id: i.product_id as string,
          p_qty: i.quantity,
        })
      )
    );

    // Send order confirmation email (fire-and-forget, non-blocking)
    const shippingDetails = data.shipping_details as Record<string, string>;
    const email = shippingDetails.email;
    if (email) {
      sendOrderConfirmation(email, order.id, data.total_cents).catch(() => {});
    }

    return { id: order.id };
  });

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, payment_status, fulfillment_status, created_at, tracking_number")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });
