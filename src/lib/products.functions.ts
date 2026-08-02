import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { getFallbackProductBySlug, getFallbackProducts } from "@/lib/fallback-data";
import { getPublicClient } from "@/lib/supabase-server";


export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, title, description, price_cents, inventory_count, image_urls, sizes, colors, category")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    
    const dbProducts = data ?? [];
    const dbSlugs = new Set(dbProducts.map((p) => p.slug));
    const extraFallbacks = getFallbackProducts().filter((p) => !dbSlugs.has(p.slug) && p.is_active !== false);

    return [...dbProducts, ...extraFallbacks];
  } catch (error) {
    console.warn("Falling back to local product data:", error);
    return getFallbackProducts();
  }
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((data) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const rawSlug = data.slug;
    const decodedSlug = decodeURIComponent(rawSlug).trim();
    const cleanSlug = decodedSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const supabase = getPublicClient();
      const { data: product, error } = await supabase
        .from("products")
        .select("id, slug, title, description, price_cents, inventory_count, image_urls, sizes, colors, category")
        .or(`slug.eq."${rawSlug}",slug.eq."${cleanSlug}",slug.ilike."${cleanSlug}"`)
        .eq("is_active", true)
        .maybeSingle();
      if (!error && product) return product;
    } catch (_) {}

    const fallbacks = getFallbackProducts();
    const found = fallbacks.find(
      (p) =>
        p.slug.toLowerCase() === rawSlug.toLowerCase() ||
        p.slug.toLowerCase() === cleanSlug ||
        p.slug.toLowerCase().replace(/-/g, " ") === decodedSlug.toLowerCase().replace(/-/g, " ")
    );
    if (found) return found;
    throw new Error("Product not found");
  });
