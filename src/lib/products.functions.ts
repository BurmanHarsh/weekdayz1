import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { getFallbackProductBySlug, getFallbackProducts } from "@/lib/fallback-data";

function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, title, description, price_cents, inventory_count, image_urls, sizes, colors, category")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? getFallbackProducts();
  } catch (error) {
    console.warn("Falling back to local product data:", error);
    return getFallbackProducts();
  }
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const supabase = getPublicClient();
      const { data: product, error } = await supabase
        .from("products")
        .select("id, slug, title, description, price_cents, inventory_count, image_urls, sizes, colors, category")
        .eq("slug", data.slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!product) {
        const fallback = getFallbackProductBySlug(data.slug);
        if (fallback) return fallback;
        throw new Error("Product not found");
      }
      return product;
    } catch (error) {
      console.warn("Falling back to local product data for slug:", data.slug, error);
      const fallback = getFallbackProductBySlug(data.slug);
      if (fallback) return fallback;
      throw new Error("Product not found");
    }
  });
