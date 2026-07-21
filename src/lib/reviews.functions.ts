import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { getFallbackReviews } from "@/lib/fallback-data";

function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
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
    const { error } = await context.supabase
      .from("product_reviews")
      .upsert(
        {
          user_id: context.userId,
          product_id: data.product_id,
          rating: data.rating,
          body: data.body,
        },
        { onConflict: "user_id,product_id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
