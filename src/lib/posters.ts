import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPublicClient } from "@/lib/supabase-server";
import { z } from "zod";

export interface WebsitePoster {
  id: string;
  img: string;
  kicker: string;
  title: string;
  sub: string;
  badge?: string;
  to: string;
  cta: string;
  is_active: boolean;
}

export const DEFAULT_POSTERS: WebsitePoster[] = [];

const LEGACY_POSTER_IDS = new Set(["poster-rcb-26", "poster-oversized-ss26", "poster-f1-pitlane"]);

export function cleanLegacyPosters(posters: WebsitePoster[]): WebsitePoster[] {
  if (!Array.isArray(posters)) return [];
  return posters.filter((p) => p && p.id && !LEGACY_POSTER_IDS.has(p.id));
}

const STORAGE_KEY = "weekdayz_website_posters_v2";

export const getWebsitePostersServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase.storage
      .from("product-images")
      .download("website_posters.json");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return cleanLegacyPosters(parsed);
      }
    }
  } catch (e: any) {
    console.warn("[getWebsitePostersServer] Storage read exception:", e?.message);
  }
  return [];
});

export const saveWebsitePostersServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.array(z.any()).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const cleanData = cleanLegacyPosters(data);
      const buffer = Buffer.from(JSON.stringify(cleanData, null, 2), "utf-8");

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (supabaseAdmin) {
            await supabaseAdmin.storage
              .from("product-images")
              .upload("website_posters.json", buffer, { upsert: true, contentType: "application/json" });
            return { ok: true };
          }
        } catch (_) {}
      }

      const { error } = await context.supabase.storage
        .from("product-images")
        .upload("website_posters.json", buffer, { upsert: true, contentType: "application/json" });

      if (error) {
        console.warn("[saveWebsitePostersServer] user client error:", error.message);
      }
      return { ok: true };
    } catch (e: any) {
      console.warn("[saveWebsitePostersServer] Storage write exception:", e?.message);
      return { ok: false, error: e?.message };
    }
  });

export function fetchWebsitePosters(): WebsitePoster[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = cleanLegacyPosters(parsed);
      if (cleaned.length !== parsed.length) {
        // Persist cleaned version if legacy items were pruned
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch (e) {
    console.error("Failed to parse website posters from storage", e);
  }
  return [];
}

export function saveWebsitePosters(posters: WebsitePoster[]) {
  if (typeof window === "undefined") return;
  const cleanData = cleanLegacyPosters(posters);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    window.dispatchEvent(new Event("website-posters-updated"));
  } catch (e: any) {
    const isQuota =
      e?.name === "QuotaExceededError" ||
      e?.code === 22 ||
      e?.code === 1014 ||
      /quota/i.test(String(e?.message ?? ""));
    if (isQuota) {
      console.warn("Posters storage quota exceeded — trimming prior entries");
      const trimmed = cleanData.map((p, i) =>
        i === cleanData.length - 1
          ? p
          : { ...p, img: typeof p.img === "string" && p.img.startsWith("data:") ? "" : p.img },
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        window.dispatchEvent(new Event("website-posters-updated"));
        return;
      } catch {
        // give up silently
      }
    }
    console.error("Failed to save website posters to storage", e);
  }
}
