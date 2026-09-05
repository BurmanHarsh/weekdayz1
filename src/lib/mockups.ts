import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPublicClient } from "@/lib/supabase-server";
import { z } from "zod";

export interface MockupColor {
  id: string;
  name: string;
  hex: string;
  frontMockup?: string;
  backMockup?: string;
  sleeveMockup?: string;
  isActive: boolean;
}

export const DEFAULT_MOCKUP_COLORS: MockupColor[] = [
  {
    id: "color-white",
    name: "White",
    hex: "#FFFFFF",
    frontMockup: "/products/tee-white.jpg",
    backMockup: "/products/tee-white.jpg",
    sleeveMockup: "/products/tee-white.jpg",
    isActive: true,
  },
  {
    id: "color-navy",
    name: "Navy Blue",
    hex: "#0F2042",
    frontMockup: "/products/tee-black.jpg",
    backMockup: "/products/tee-black.jpg",
    sleeveMockup: "/products/tee-black.jpg",
    isActive: true,
  },
  {
    id: "color-black",
    name: "Black",
    hex: "#111111",
    frontMockup: "/products/tee-black.jpg",
    backMockup: "/products/tee-black.jpg",
    sleeveMockup: "/products/tee-black.jpg",
    isActive: true,
  },
  {
    id: "color-offwhite",
    name: "Off White",
    hex: "#EFE6D5",
    frontMockup: "/products/tee-white.jpg",
    backMockup: "/products/tee-white.jpg",
    sleeveMockup: "/products/tee-white.jpg",
    isActive: true,
  },
];

const STORAGE_KEY = "weekdayzz_mockups_and_colors_v2";

export function fetchLocalMockupColors(): MockupColor[] {
  if (typeof window === "undefined") return DEFAULT_MOCKUP_COLORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MOCKUP_COLORS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn("Failed to load local mockup colors:", e);
  }
  return DEFAULT_MOCKUP_COLORS;
}

export function saveLocalMockupColors(colors: MockupColor[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    window.dispatchEvent(new CustomEvent("mockups-updated", { detail: colors }));
  } catch (e) {
    console.warn("Failed to save local mockup colors:", e);
  }
}

export const getMockupSettingsServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase.storage
      .from("product-images")
      .download("mockup_settings.json");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as MockupColor[];
      }
    }
  } catch (e: any) {
    console.warn("[getMockupSettingsServer] Storage read exception:", e?.message);
  }
  return DEFAULT_MOCKUP_COLORS;
});

export const saveMockupSettingsServer = createServerFn({ method: "POST" })
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
              .upload("mockup_settings.json", buffer, { upsert: true, contentType: "application/json" });
            return { ok: true };
          }
        } catch (_) {}
      }

      const { error } = await context.supabase.storage
        .from("product-images")
        .upload("mockup_settings.json", buffer, { upsert: true, contentType: "application/json" });

      if (error) {
        console.warn("[saveMockupSettingsServer] storage upload error:", error.message);
      }
      return { ok: true };
    } catch (err: any) {
      console.error("[saveMockupSettingsServer] save error:", err);
      return { ok: false, error: err?.message };
    }
  });
