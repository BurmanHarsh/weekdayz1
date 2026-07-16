import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const myWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist")
      .select("product_id, products(id, slug, title, price_cents, image_urls, category)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ product_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", data.product_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { wishlisted: false };
    } else {
      const { error } = await supabase
        .from("wishlist")
        .insert({ user_id: userId, product_id: data.product_id });
      if (error) throw new Error(error.message);
      return { wishlisted: true };
    }
  });

export const getWishlistIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist")
      .select("product_id");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { product_id: string }) => r.product_id);
  });
