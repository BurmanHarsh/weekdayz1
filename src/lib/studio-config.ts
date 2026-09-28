import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPublicClient } from "@/lib/supabase-server";
import { z } from "zod";

export interface StudioRates {
  defaultBasePrice: number;        // in paise (e.g. 189900 = ₹1,899)
  customPrintSurcharge: number;    // in paise (e.g. 20000 = ₹200)
  frontChestPrintPrice: number;    // in paise (e.g. 9900 = ₹99)
  frontFullPrintPrice: number;     // in paise (e.g. 19900 = ₹199)
  backFullPrintPrice: number;      // in paise (e.g. 19900 = ₹199)
  sleevePrintPrice: number;        // in paise (e.g. 5900 = ₹59)
}

export interface GarmentCatalogItem {
  id: string;
  name: string;
  category?: string;
  basePrice: number;               // in paise (e.g. 189900 = ₹1,899)
  surcharge?: number;              // optional print surcharge override in paise
  image: string;                   // catalog preview/mockup image
  description?: string;
  sizes: string[];
  isActive: boolean;
  badge?: string;
  createdAt?: string;
}

export interface CustomStudioConfig {
  rates: StudioRates;
  catalogs: GarmentCatalogItem[];
}

export const DEFAULT_STUDIO_RATES: StudioRates = {
  defaultBasePrice: 189900,
  customPrintSurcharge: 20000,
  frontChestPrintPrice: 9900,
  frontFullPrintPrice: 19900,
  backFullPrintPrice: 19900,
  sleevePrintPrice: 5900,
};

export const DEFAULT_CATALOGS: GarmentCatalogItem[] = [
  {
    id: "cat-oversized-tee",
    name: "Oversized Tees",
    category: "T-Shirts",
    basePrice: 189900,
    image: "/products/tee-black.jpg",
    description: "240 GSM 100% Combed Terry Cotton. Premium streetwear boxy fit with dropped shoulders.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    isActive: true,
    badge: "Bestseller",
  },
  {
    id: "cat-baby-tee",
    name: "Baby Tees",
    category: "T-Shirts",
    basePrice: 149900,
    image: "/products/tee-white.jpg",
    description: "Fitted 90s silhouette in soft ribbed cotton. Cropped vintage street aesthetic.",
    sizes: ["XS", "S", "M", "L", "XL"],
    isActive: true,
    badge: "Trending",
  },
  {
    id: "cat-polo-tee",
    name: "Polo Tees",
    category: "Polos",
    basePrice: 199900,
    image: "/products/tee-green.jpg",
    description: "260 GSM Pique Knit with knit collar and ribbed cuffs. Retro motorsport aesthetic.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    isActive: true,
  },
  {
    id: "cat-regular-fit",
    name: "Regular Fit",
    category: "T-Shirts",
    basePrice: 169900,
    image: "/products/tee-gray.jpg",
    description: "200 GSM everyday classic fit tee. Pre-shrunk, bio-washed daily essential.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    isActive: true,
  },
  {
    id: "cat-hoodies",
    name: "Hoodies",
    category: "Hoodies",
    basePrice: 269900,
    image: "/products/hoodie-black.jpg",
    description: "380 GSM Heavyweight French Terry fleece. Double-layered structured hood with kangaroo pocket.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    isActive: true,
    badge: "Heavyweight",
  },
  {
    id: "cat-sweatshirts",
    name: "Sweatshirts",
    category: "Sweatshirts",
    basePrice: 239900,
    image: "/products/hoodie-sand.jpg",
    description: "320 GSM French Terry crewneck sweatshirt with ribbed hem and cuffs.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    isActive: true,
  },
];

export const DEFAULT_STUDIO_CONFIG: CustomStudioConfig = {
  rates: DEFAULT_STUDIO_RATES,
  catalogs: DEFAULT_CATALOGS,
};

const STORAGE_KEY = "weekdayzz_studio_config_v1";

export function fetchLocalStudioConfig(): CustomStudioConfig {
  if (typeof window === "undefined") return DEFAULT_STUDIO_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDIO_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        rates: {
          ...DEFAULT_STUDIO_RATES,
          ...(parsed.rates || {}),
        },
        catalogs: Array.isArray(parsed.catalogs) && parsed.catalogs.length > 0
          ? parsed.catalogs
          : DEFAULT_CATALOGS,
      };
    }
  } catch (e) {
    console.warn("Failed to load local studio config:", e);
  }
  return DEFAULT_STUDIO_CONFIG;
}

export function saveLocalStudioConfig(config: CustomStudioConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("studio-config-updated", { detail: config }));
  } catch (e) {
    console.warn("Failed to save local studio config:", e);
  }
}

export const getStudioConfigServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase.storage
      .from("product-images")
      .download("custom_studio_settings.json");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        return {
          rates: {
            ...DEFAULT_STUDIO_RATES,
            ...(parsed.rates || {}),
          },
          catalogs: Array.isArray(parsed.catalogs) && parsed.catalogs.length > 0
            ? parsed.catalogs
            : DEFAULT_CATALOGS,
        } as CustomStudioConfig;
      }
    }
  } catch (e: any) {
    console.warn("[getStudioConfigServer] Storage read exception:", e?.message);
  }
  return DEFAULT_STUDIO_CONFIG;
});

export const saveStudioConfigServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.any().parse(data))
  .handler(async ({ data, context }) => {
    try {
      const buffer = Buffer.from(JSON.stringify(data, null, 2), "utf-8");

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (supabaseAdmin) {
            await supabaseAdmin.storage
              .from("product-images")
              .upload("custom_studio_settings.json", buffer, { upsert: true, contentType: "application/json" });
            return { ok: true };
          }
        } catch (_) {}
      }

      const { error } = await context.supabase.storage
        .from("product-images")
        .upload("custom_studio_settings.json", buffer, { upsert: true, contentType: "application/json" });

      if (error) {
        console.warn("[saveStudioConfigServer] user client error:", error.message);
      }
      return { ok: true };
    } catch (e: any) {
      console.warn("[saveStudioConfigServer] Storage write exception:", e?.message);
      return { ok: false, error: e?.message };
    }
  });
