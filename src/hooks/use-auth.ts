import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_CACHE_KEY = "wdz_admin_role";
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface AdminCacheEntry {
  userId: string;
  isAdmin: boolean;
  cachedAt: number;
}

function readAdminCache(userId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const entry: AdminCacheEntry = JSON.parse(raw);
    if (entry.userId !== userId) return null;
    if (Date.now() - entry.cachedAt > ADMIN_CACHE_TTL_MS) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
      return null;
    }
    // If cached as non-admin, always bypass cache to detect newly granted admin roles immediately
    if (!entry.isAdmin) return null;
    return entry.isAdmin;
  } catch {
    return null;
  }
}

function writeAdminCache(userId: string, isAdmin: boolean) {
  try {
    const entry: AdminCacheEntry = { userId, isAdmin, cachedAt: Date.now() };
    sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage unavailable (SSR, private browsing edge cases) — silently ignore
  }
}

function clearAdminCache() {
  try {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // no-op
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!alive) return;
      setSession(s);
      setUser(s?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      clearAdminCache();
      return;
    }

    // Try cache first — avoids a DB round-trip on tab switches
    const cached = readAdminCache(user.id);
    if (cached !== null) {
      setIsAdmin(cached);
      return;
    }

    let cancelled = false;

    // Call SECURITY DEFINER RPC has_role for foolproof admin verification
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data === true) {
          setIsAdmin(true);
          writeAdminCache(user.id, true);
          return;
        }

        // Direct table fallback check
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data: tableData }) => {
            if (!cancelled) {
              const result = Boolean(tableData);
              setIsAdmin(result);
              writeAdminCache(user.id, result);
            }
          });
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { session, user, loading, isAdmin };
}
