import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { getFallbackReviews } from "@/lib/fallback-data";
import { getPublicClient } from "@/lib/supabase-server";

/**
 * Checks whether a user has at least one paid order containing the given product.
 * Shared by canUserReviewProduct and submitReview to avoid query duplication.
 */
async function verifyPurchase(
  supabase: ReturnType<typeof getPublicClient>,
  userId: string,
  productId: string,
) {
  const { data: item } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, payment_status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .eq("orders.payment_status", "paid")
    .limit(1)
    .maybeSingle();
  return Boolean(item);
}

export const getProductReviews = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ product_id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const supabase = getPublicClient();
      const { data: reviews, error } = await supabase
        .from("product_reviews")
        .select("id, rating, body, created_at, user_id, profiles(full_name)")
        .eq("product_id", data.product_id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return reviews ?? [];
    } catch (error) {
      console.warn("Falling back to local reviews:", error);
      return getFallbackReviews();
    }
  });

export const canUserReviewProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ product_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const hasPurchased = await verifyPurchase(context.supabase, context.userId, data.product_id);
    return { canReview: hasPurchased };
  });

import { checkRateLimit } from "./rate-limiter";
import { sanitizeInput } from "./security";

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        product_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        body: z.string().max(1000).default(""),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Rate limiting: Max 5 review submissions per hour per user
    checkRateLimit(
      `submit_review_${userId}`,
      5,
      60 * 60 * 1000,
      "Too many review submissions. Please wait before submitting another review."
    );

    // Verify user has purchased this item
    const hasPurchased = await verifyPurchase(supabase, userId, data.product_id);
    if (!hasPurchased) {
      throw new Error("Security Alert: You can only review products you have purchased.");
    }

    const sanitizedBody = sanitizeInput(data.body);

    const { error } = await supabase
      .from("product_reviews")
      .upsert(
        {
          user_id: userId,
          product_id: data.product_id,
          rating: data.rating,
          body: sanitizedBody,
        },
        { onConflict: "user_id,product_id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ product_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("product_reviews")
      .delete()
      .eq("user_id", context.userId)
      .eq("product_id", data.product_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Fetch the N most recent reviews site-wide for the homepage marquee. */
export const listLatestReviews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, rating, body, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id as string,
      reviewer_name: (r.profiles?.full_name as string | null) ?? "Anonymous",
      rating: r.rating as number,
      body: r.body as string,
    }));
  } catch {
    // Return empty — homepage marquee is optional
    return [];
  }
});


