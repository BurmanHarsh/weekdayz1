import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getFallbackProducts } from "@/lib/fallback-data";

function getAuthToken(): string | undefined {
  try {
    const req = getRequest();
    const auth = req?.headers?.get("authorization");
    if (auth && auth.startsWith("Bearer ")) {
      return auth.replace("Bearer ", "");
    }
  } catch (_) {}
  return undefined;
}

async function getSupabaseUser(token?: string) {
  if (!token) return null;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

async function updateSupabaseUserMetadata(token: string, metadata: Record<string, any>) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !token) return false;

  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: metadata }),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export const myWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = getAuthToken();
    const user = await getSupabaseUser(token);

    const rawWishlist: string[] = Array.isArray(user?.user_metadata?.wishlist)
      ? user.user_metadata.wishlist
      : [];

    const fallbacks = getFallbackProducts();

    const metadataWishlist = Array.from(
      new Set(
        rawWishlist.map((item) => {
          const match = fallbacks.find((p) => p.id === item || p.slug === item);
          return match ? match.id : item;
        })
      )
    );

    const dbItems: any[] = [];
    try {
      const { data } = await context.supabase
        .from("wishlist")
        .select("product_id, products(id, slug, title, price_cents, compare_at_price_cents, image_urls, category)")
        .order("created_at", { ascending: false });
      if (data) dbItems.push(...data);
    } catch (_) {}

    const result: any[] = [];
    const seenIds = new Set<string>();

    for (const item of dbItems) {
      if (item.products && !seenIds.has(item.products.id)) {
        seenIds.add(item.products.id);
        seenIds.add(item.products.slug);
        result.push(item);
      }
    }

    for (const idOrSlug of metadataWishlist) {
      const fb = fallbacks.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
      if (fb && !seenIds.has(fb.id)) {
        seenIds.add(fb.id);
        seenIds.add(fb.slug);
        result.push({
          product_id: fb.id,
          products: {
            id: fb.id,
            slug: fb.slug,
            title: fb.title,
            price_cents: fb.price_cents,
            image_urls: fb.image_urls,
            category: fb.category,
          },
        });
      }
    }

    return result;
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ product_id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const token = getAuthToken();
    if (!token) throw new Error("Unauthorized");

    const user = await getSupabaseUser(token);
    if (!user) throw new Error("Unauthorized");

    const inputId = data.product_id;
    const fallbacks = getFallbackProducts();
    const fb = fallbacks.find((p) => p.id === inputId || p.slug === inputId);

    const canonicalId = fb ? fb.id : inputId;
    const slug = fb ? fb.slug : inputId;

    const rawWishlist: string[] = Array.isArray(user.user_metadata?.wishlist)
      ? user.user_metadata.wishlist
      : [];

    const currentWishlist = Array.from(
      new Set(
        rawWishlist.map((item) => {
          const match = fallbacks.find((p) => p.id === item || p.slug === item);
          return match ? match.id : item;
        })
      )
    );

    const isAlreadyWishlisted = currentWishlist.includes(canonicalId);

    let updatedWishlist: string[];
    let wishlisted = false;

    if (isAlreadyWishlisted) {
      updatedWishlist = currentWishlist.filter((id) => id !== canonicalId && id !== slug);
      wishlisted = false;
    } else {
      updatedWishlist = Array.from(new Set([...currentWishlist, canonicalId]));
      wishlisted = true;
    }

    await updateSupabaseUserMetadata(token, { wishlist: updatedWishlist });

    try {
      const { data: existing } = await context.supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", canonicalId)
        .maybeSingle();

      if (isAlreadyWishlisted && existing) {
        await context.supabase.from("wishlist").delete().eq("id", existing.id);
      } else if (!isAlreadyWishlisted && !existing) {
        await context.supabase.from("wishlist").insert({ user_id: user.id, product_id: canonicalId });
      }
    } catch (_) {}

    return { wishlisted };
  });

export const getWishlistIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = getAuthToken();
    const user = await getSupabaseUser(token);

    const rawWishlist: string[] = Array.isArray(user?.user_metadata?.wishlist)
      ? user.user_metadata.wishlist
      : [];

    const fallbacks = getFallbackProducts();
    const ids: string[] = [];

    rawWishlist.forEach((item) => {
      ids.push(item);
      const fb = fallbacks.find((p) => p.id === item || p.slug === item);
      if (fb) {
        ids.push(fb.id);
        ids.push(fb.slug);
      }
    });

    try {
      const { data } = await context.supabase.from("wishlist").select("product_id, products(id, slug)");
      (data ?? []).forEach((r: any) => {
        if (r.product_id) ids.push(r.product_id);
        if (r.products?.id) ids.push(r.products.id);
        if (r.products?.slug) ids.push(r.products.slug);
      });
    } catch (_) {}

    return Array.from(new Set(ids));
  });






