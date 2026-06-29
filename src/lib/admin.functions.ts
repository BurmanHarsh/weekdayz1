import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { admin: Boolean(data) };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [revenue, pending, custom] = await Promise.all([
      context.supabase.from("orders").select("total_cents").eq("payment_status", "paid"),
      context.supabase.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_status", "processing"),
      context.supabase
        .from("order_items")
        .select("id, orders!inner(fulfillment_status)", { count: "exact", head: true })
        .not("custom_design_id", "is", null)
        .eq("orders.fulfillment_status", "processing"),
    ]);
    const totalRevenue = (revenue.data ?? []).reduce(
      (s: number, r: { total_cents: number }) => s + (r.total_cents ?? 0),
      0,
    );
    return {
      total_revenue_cents: totalRevenue,
      pending_standard_orders: pending.count ?? 0,
      pending_custom_orders: custom.count ?? 0,
    };
  });

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, user_id, total_cents, payment_status, fulfillment_status, tracking_number, shipping_details, created_at, order_items(id, product_id, custom_design_id, quantity, size, unit_price_cents, title_snapshot, image_snapshot, custom_designs(id, design_file_url, base_color, placement_settings))",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        fulfillment_status: z.enum(["processing", "printed", "shipped", "delivered", "cancelled"]),
        tracking_number: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({
        fulfillment_status: data.fulfillment_status,
        ...(data.tracking_number !== undefined ? { tracking_number: data.tracking_number } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1),
        title: z.string().min(1),
        description: z.string().default(""),
        price_cents: z.number().int().nonnegative(),
        inventory_count: z.number().int().nonnegative(),
        image_urls: z.array(z.string()).default([]),
        sizes: z.array(z.string()).default(["S", "M", "L", "XL", "XXL"]),
        colors: z.array(z.string()).default([]),
        category: z.string().default("tee"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("products")
      .insert(data)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create product");
    return { id: row.id };
  });

export const getSignedAdminDesignUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: signed, error } = await context.supabase.storage
      .from("user-graphics")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });
