import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendOrderConfirmation } from "./email";
import { verifySignature } from "./razorpay.functions";
import { createShiprocketOrder } from "./shipping";

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
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => PlaceOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Verify Razorpay Payment Signature
    const isPaymentVerified = verifySignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature
    );

    if (!isPaymentVerified) {
      throw new Error("Payment signature verification failed. Order placement aborted.");
    }

    // 2. Insert order record into database
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: data.total_cents,
        payment_status: "paid",
        fulfillment_status: "processing",
        shipping_details: data.shipping_details,
      })
      .select("id")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Failed to create order in database");

    // 3. Insert order items
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

    // 4. Atomically decrement inventory for each product in the order
    const productItems = data.items.filter((i) => i.product_id);
    await Promise.all(
      productItems.map((i) =>
        supabase.rpc("decrement_inventory", {
          p_product_id: i.product_id as string,
          p_qty: i.quantity,
        })
      )
    );

    // 5. Gather shipping weight and package dimensions from products table
    let totalWeight = 0;
    let maxLength = 30;
    let maxWidth = 20;
    let maxHeight = 0;

    const productIds = data.items.map((i) => i.product_id).filter(Boolean) as string[];
    if (productIds.length > 0) {
      const { data: dbProducts } = await supabase
        .from("products")
        .select("id, weight_g, length_cm, width_cm, height_cm")
        .in("id", productIds);

      const productMap = new Map(dbProducts?.map((p) => [p.id, p]) ?? []);

      data.items.forEach((item) => {
        const prod = item.product_id ? productMap.get(item.product_id) : null;
        totalWeight += (prod?.weight_g ?? 300) * item.quantity;
        maxLength = Math.max(maxLength, prod?.length_cm ? Number(prod.length_cm) : 30);
        maxWidth = Math.max(maxWidth, prod?.width_cm ? Number(prod.width_cm) : 20);
        maxHeight += (prod?.height_cm ? Number(prod.height_cm) : 3) * item.quantity;
      });
    } else {
      data.items.forEach((item) => {
        totalWeight += 300 * item.quantity;
        maxHeight += 3 * item.quantity;
      });
    }

    // 6. Connect to Shiprocket API and dispatch shipment
    let srOrderDetails = null;
    try {
      srOrderDetails = await createShiprocketOrder({
        orderId: order.id,
        address: data.shipping_details as any,
        totalCents: data.total_cents,
        items: data.items.map((it) => ({
          title: it.title_snapshot,
          quantity: it.quantity,
          unitPriceCents: it.unit_price_cents,
        })),
        weightKg: totalWeight / 1000,
        lengthCm: maxLength,
        widthCm: maxWidth,
        heightCm: maxHeight,
      });
    } catch (err) {
      console.warn("Failed creating Shiprocket shipment record:", err);
    }

    const estimatedDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // standard 4 days fallback

    // 7. Update database with Shiprocket details if successfully registered
    if (srOrderDetails) {
      await supabase
        .from("orders")
        .update({
          shiprocket_order_id: srOrderDetails.shiprocketOrderId,
          shiprocket_shipment_id: srOrderDetails.shiprocketShipmentId,
          estimated_delivery_date: estimatedDelivery.toISOString(),
        })
        .eq("id", order.id);
    } else {
      await supabase
        .from("orders")
        .update({
          estimated_delivery_date: estimatedDelivery.toISOString(),
        })
        .eq("id", order.id);
    }

    // 8. Trigger transactional email
    const shippingDetails = data.shipping_details as Record<string, string>;
    const email = shippingDetails.email;
    if (email) {
      sendOrderConfirmation(email, order.id, data.total_cents, estimatedDelivery.toISOString()).catch(
        (err) => console.error("Email delivery failed:", err)
      );
    }

    return { id: order.id };
  });

export const myOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, total_cents, payment_status, fulfillment_status, created_at, tracking_number, estimated_delivery_date")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });
