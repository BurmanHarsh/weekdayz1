import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Creates an unauthenticated Supabase client for server-side use.
 * Use this for public-facing queries that don't require user auth
 * (e.g. listing products, fetching reviews).
 */
export function getPublicClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[getPublicClient] Missing Supabase URL or Key environment variables.");
  }

  return createClient<Database>(
    url!,
    key!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}
