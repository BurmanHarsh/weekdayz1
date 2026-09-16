import heroCottonbro from "@/assets/pexels-cottonbro-6069083.jpg";
import heroFreestock from "@/assets/pexels-freestockpro-7444126.jpg";
import heroJohnRae from "@/assets/pexels-john-rae-cayabyab-1570188-4944121.jpg";
import heroVisualkevv from "@/assets/pexels-visualkevv-28076806.jpg";
import heroSynthesis from "@/assets/SYNTHESIS _ PROTOTYPE 04 - JANIS SNE.jpeg";
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

export const DEFAULT_POSTERS: WebsitePoster[] = [
  {
    id: "poster-street-culture",
    img: heroCottonbro,
    kicker: "NEW ARRIVALS · SS26",
    title: "STREET CULTURE",
    sub: "Engineered oversized fits and heavyweight drops for the new era.",
    badge: "NEW DROP",
    to: "/shop",
    cta: "SHOP COLLECTION",
    is_active: true,
  },
  {
    id: "poster-minimal-edit",
    img: heroFreestock,
    kicker: "LIMITED EDITION",
    title: "THE MINIMAL EDIT",
    sub: "Uncompromising quality. 240+ GSM crafted everyday essentials.",
    badge: "FLAT 20% OFF",
    to: "/shop",
    cta: "EXPLORE NOW",
    is_active: true,
  },
  {
    id: "poster-signature",
    img: heroJohnRae,
    kicker: "WEEKDAYZZ SIGNATURE",
    title: "RAW & REFINED",
    sub: "Statement graphics and modern silhouettes made to turn heads.",
    badge: "BESTSELLER",
    to: "/shop",
    cta: "SHOP THE LOOK",
    is_active: true,
  },
  {
    id: "poster-urban-essentials",
    img: heroVisualkevv,
    kicker: "TRENDING NOW",
    title: "URBAN ESSENTIALS",
    sub: "Everyday luxury streetwear designed for effortless styling.",
    badge: "FROM ₹500",
    to: "/shop",
    cta: "DISCOVER MORE",
    is_active: true,
  },
  {
    id: "poster-future-synthesis",
    img: heroSynthesis,
    kicker: "EXCLUSIVE DROP",
    title: "FUTURE SYNTHESIS",
    sub: "Experimental cuts, avant-garde textures, and signature fits.",
    badge: "HIGH DEMAND",
    to: "/shop",
    cta: "GRAB YOURS",
    is_active: true,
  },
];

const STORAGE_KEY = "weekdayz_website_posters_v3";

export const getWebsitePostersServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase.storage
      .from("product-images")
      .download("website_posters.json");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length >= 5) {
        const hasLegacy = parsed.some((p: any) => p.id === "poster-rcb-26");
        if (!hasLegacy) {
          return parsed as WebsitePoster[];
        }
      }
    }
  } catch (e: any) {
    console.warn("[getWebsitePostersServer] Storage read exception:", e?.message);
  }
  return DEFAULT_POSTERS;
});

export const saveWebsitePostersServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.array(z.any()).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const buffer = Buffer.from(JSON.stringify(data, null, 2), "utf-8");

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
  if (typeof window === "undefined") return DEFAULT_POSTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSTERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 5) {
      const hasLegacy = parsed.some((p: any) => p.id === "poster-rcb-26");
      if (!hasLegacy) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse website posters from storage", e);
  }
  return DEFAULT_POSTERS;
}

export function saveWebsitePosters(posters: WebsitePoster[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event("website-posters-updated"));
  } catch (e: any) {
    const isQuota =
      e?.name === "QuotaExceededError" ||
      e?.code === 22 ||
      e?.code === 1014 ||
      /quota/i.test(String(e?.message ?? ""));
    if (isQuota) {
      console.warn("Posters storage quota exceeded — trimming prior entries");
      const trimmed = posters.map((p, i) =>
        i === posters.length - 1
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
