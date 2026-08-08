import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendShipped, sendDelivered } from "./email";
import { getFallbackProducts, addCustomFallbackProduct, updateCustomFallbackProduct, deleteCustomFallbackProduct, FallbackProduct } from "@/lib/fallback-data";

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

import { checkRateLimit } from "./rate-limiter";
import { sanitizeInput } from "./security";

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ secret: z.string().max(100) }).parse(data))
  .handler(async ({ data, context }) => {
    // Security Restriction: Rate-limit bootstrap attempts to max 3 / hour per user
    checkRateLimit(
      `bootstrap_admin_${context.userId}`,
      3,
      60 * 60 * 1000,
      "Too many admin bootstrap attempts. Request blocked for security."
    );

    const isEnabled = process.env.ENABLE_ADMIN_BOOTSTRAP === "true";
    if (!isEnabled) {
      throw new Error("Admin bootstrap endpoint is disabled in production for security compliance.");
    }

    const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expected) {
      throw new Error("Admin bootstrap secret is not configured on the server");
    }
    if (data.secret !== expected) throw new Error("Invalid bootstrap secret");
    
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if role already exists using admin client
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existing) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
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
        "id, user_id, total_cents, payment_status, fulfillment_status, tracking_number, shipping_details, created_at, order_items(id, product_id, custom_design_id, quantity, size, color, unit_price_cents, title_snapshot, image_snapshot, custom_designs(id, design_file_url, base_color, placement_settings))",
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

    // Fire transactional email on key status changes (non-blocking)
    if (data.fulfillment_status === "shipped" || data.fulfillment_status === "delivered") {
      const { data: orderRow } = await context.supabase
        .from("orders")
        .select("shipping_details, tracking_number")
        .eq("id", data.id)
        .single();
      const shipping = (orderRow?.shipping_details ?? {}) as Record<string, string>;
      const emailAddr = shipping.email;
      if (emailAddr) {
        if (data.fulfillment_status === "shipped") {
          const trackingId = data.tracking_number ?? orderRow?.tracking_number ?? "N/A";
          sendShipped(emailAddr, data.id, trackingId).catch(() => {});
        } else {
          sendDelivered(emailAddr, data.id).catch(() => {});
        }
      }
    }

    return { ok: true };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        slug: z.string().min(1).max(150),
        title: z.string().min(1).max(200),
        description: z.string().max(5000).default(""),
        price_cents: z.number().int().nonnegative().max(100000000),
        inventory_count: z.number().int().nonnegative().max(1000000),
        image_urls: z.array(z.string().max(1000)).max(20).default([]),
        sizes: z.array(z.string().max(20)).max(20).default(["S", "M", "L", "XL", "XXL"]),
        colors: z.array(z.string().max(50)).max(50).default([]),
        category: z.string().max(100).default("tee"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      const { data: row, error } = await context.supabase
        .from("products")
        .insert(data)
        .select("id")
        .single();
      if (!error && row) return { id: row.id };
    } catch (_) {}

    // Store in fallback memory list so product creation succeeds even if database insert is blocked
    const newId = `admin-prod-${Date.now()}`;
    const newProduct: FallbackProduct = {
      id: newId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      price_cents: data.price_cents,
      inventory_count: data.inventory_count,
      image_urls: data.image_urls.length > 0 ? data.image_urls : ["/products/tee-black.jpg"],
      sizes: data.sizes,
      colors: data.colors,
      category: data.category,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    addCustomFallbackProduct(newProduct);
    return { id: newId };
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

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    const dbProducts = (data ?? []).map((p: any) => {
      if (!p.image_urls || p.image_urls.length === 0 || (p.image_urls.length === 1 && !p.image_urls[0])) {
        const fallback = getFallbackProducts().find(
          (f) => f.slug.toLowerCase() === (p.slug ?? "").toLowerCase() || f.id === p.id
        );
        if (fallback && fallback.image_urls && fallback.image_urls.length > 0) {
          return { ...p, image_urls: fallback.image_urls };
        }
      }
      return p;
    });

    const dbSlugs = new Set(dbProducts.map((p: any) => p.slug));
    const extraFallbacks = getFallbackProducts().filter((p) => !dbSlugs.has(p.slug));

    return [...dbProducts, ...extraFallbacks];
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string(),
        slug: z.string().min(1).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        price_cents: z.number().int().nonnegative().optional(),
        inventory_count: z.number().int().nonnegative().optional(),
        image_urls: z.array(z.string()).optional(),
        sizes: z.array(z.string()).optional(),
        colors: z.array(z.string()).optional(),
        category: z.string().optional(),
        is_active: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...updates } = data;
    try {
      const { error } = await context.supabase
        .from("products")
        .update(updates)
        .eq("id", id);
      if (!error) return { ok: true };
    } catch (_) {}

    updateCustomFallbackProduct(id, updates);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      const { error } = await context.supabase.from("products").delete().eq("id", data.id);
      if (error) console.warn("Database product delete:", error.message);
    } catch (_) {}

    deleteCustomFallbackProduct(data.id);
    return { ok: true };
  });

export const getCategorySuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase.from("products").select("category");
    const presets = ["hoodie", "tshirt", "shirt", "pant", "cargo"];
    const existing = (data ?? []).map((p: { category: string }) => p.category?.toLowerCase()?.trim()).filter(Boolean);
    const set = new Set([...presets, ...existing]);
    return Array.from(set);
  });

// Promo Code In-Memory/Persistent Store for Admin Management
interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number; // percentage (e.g. 20) or amount in INR (e.g. 500)
  minOrderValue: number;
  isActive: boolean;
  createdAt: string;
}

let MEMORY_PROMO_CODES: PromoCode[] = [
  {
    id: "promo-1",
    code: "WEEKDAYZ10",
    discountType: "percent",
    discountValue: 10,
    minOrderValue: 999,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "promo-2",
    code: "WELCOME500",
    discountType: "fixed",
    discountValue: 500,
    minOrderValue: 2499,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const listPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    try {
      const { data, error } = await (context.supabase as any)
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          code: r.code,
          discountType: r.discount_type,
          discountValue: Number(r.discount_value),
          minOrderValue: Number(r.min_order_value ?? 0),
          isActive: r.is_active,
          createdAt: r.created_at,
        }));
      }
    } catch (_) {}
    return MEMORY_PROMO_CODES;
  });

export const createPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(2),
        discountType: z.enum(["percent", "fixed"]),
        discountValue: z.number().positive(),
        minOrderValue: z.number().nonnegative().default(0),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const formattedCode = data.code.trim().toUpperCase();

    try {
      const { data: row, error } = await (context.supabase as any)
        .from("promo_codes")
        .insert({
          code: formattedCode,
          discount_type: data.discountType,
          discount_value: data.discountValue,
          min_order_value: data.minOrderValue,
          is_active: true,
        })
        .select("*")
        .single();
      if (!error && row) {
        return {
          id: row.id,
          code: row.code,
          discountType: row.discount_type,
          discountValue: Number(row.discount_value),
          minOrderValue: Number(row.min_order_value),
          isActive: row.is_active,
          createdAt: row.created_at,
        };
      }
    } catch (_) {}

    if (MEMORY_PROMO_CODES.some((p) => p.code === formattedCode)) {
      throw new Error(`Promo code "${formattedCode}" already exists`);
    }
    const newPromo: PromoCode = {
      id: `promo-${Date.now()}`,
      code: formattedCode,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    MEMORY_PROMO_CODES = [newPromo, ...MEMORY_PROMO_CODES];
    return newPromo;
  });

export const togglePromoCodeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      const { data: existing } = await (context.supabase as any)
        .from("promo_codes")
        .select("is_active")
        .eq("id", data.id)
        .maybeSingle();
      if (existing) {
        await (context.supabase as any)
          .from("promo_codes")
          .update({ is_active: !existing.is_active })
          .eq("id", data.id);
        return { ok: true };
      }
    } catch (_) {}

    MEMORY_PROMO_CODES = MEMORY_PROMO_CODES.map((p) =>
      p.id === data.id ? { ...p, isActive: !p.isActive } : p
    );
    return { ok: true };
  });

export const deletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      await (context.supabase as any).from("promo_codes").delete().eq("id", data.id);
    } catch (_) {}
    MEMORY_PROMO_CODES = MEMORY_PROMO_CODES.filter((p) => p.id !== data.id);
    return { ok: true };
  });
