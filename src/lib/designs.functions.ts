import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        design_file_url: z.string(),
        base_color: z.string(),
        placement_settings: z.record(z.any()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("custom_designs")
      .insert({
        user_id: context.userId,
        design_file_url: data.design_file_url,
        base_color: data.base_color,
        placement_settings: data.placement_settings,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to save design");
    return { id: row.id };
  });

export const getSignedDesignUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ path: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    // Admin or owner — RLS on storage covers it via the signed-url request below.
    const { data: signed, error } = await context.supabase.storage
      .from("user-graphics")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });
