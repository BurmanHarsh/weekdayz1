import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Creates an unauthenticated Supabase client for server-side use.
 * Use this for public-facing queries that don't require user auth
 * (e.g. listing products, fetching reviews).
 */
export function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}
