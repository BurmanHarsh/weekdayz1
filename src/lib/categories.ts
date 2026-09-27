import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPublicClient } from "@/lib/supabase-server";
import { z } from "zod";

import teesImg from "@/assets/tees.png";
import couplesImg from "@/assets/couples.png";
import statementImg from "@/assets/statement.png";
import pinterestImg from "@/assets/pinterest finds.png";
import jacketsImg from "@/assets/jackets.png";
import hoodieImg from "@/assets/hoodie.png";
import cricketImg from "@/assets/cricket.png";
import bulkImg from "@/assets/bulk.png";

export interface StoreCategory {
  id: string;
  label: string;
  cat?: string;
  img: string;
  to: string;
  search?: Record<string, string>;
  is_active: boolean;
}

export const DEFAULT_CATEGORIES: StoreCategory[] = [
  { id: "cat-tees", label: "Tees", cat: "tee", img: teesImg, to: "/shop", search: { category: "tee" }, is_active: true },
  { id: "cat-couple", label: "Couple", cat: "couple", img: couplesImg, to: "/collections/couple", is_active: true },
  { id: "cat-statement", label: "Statement", cat: "statement", img: statementImg, to: "/shop", search: { category: "statement" }, is_active: true },
  { id: "cat-pinterest", label: "Pinterest", cat: "pinterest", img: pinterestImg, to: "/shop", search: { category: "pinterest" }, is_active: true },
  { id: "cat-jackets", label: "Jackets", cat: "jacket", img: jacketsImg, to: "/shop", search: { category: "jacket" }, is_active: true },
  { id: "cat-hoodies", label: "Hoodies", cat: "hoodie", img: hoodieImg, to: "/shop", search: { category: "hoodie" }, is_active: true },
  { id: "cat-sports", label: "Sports & Fan", cat: "sports", img: cricketImg, to: "/collections/rcb", is_active: true },
  { id: "cat-bulk", label: "Bulk Orders", cat: "bulk", img: bulkImg, to: "/bulk-orders", is_active: true },
];

const STORAGE_KEY = "weekdayzz_store_categories_v1";

/** Merge saved categories with default images if img is empty or asset changed */
export function mergeCategoriesWithDefaults(categories: StoreCategory[]): StoreCategory[] {
  if (!Array.isArray(categories) || categories.length === 0) {
    return DEFAULT_CATEGORIES;
  }
  return categories.map((cat) => {
    const fallback = DEFAULT_CATEGORIES.find((d) => d.id === cat.id);
    // Only use saved img if it's a full external URL (uploaded to Supabase storage).
    // Raw filenames / stale hashed paths from old builds would 404 → always re-use
    // the current bundled asset for default categories.
    const isExternalUrl =
      cat.img && (cat.img.startsWith("http://") || cat.img.startsWith("https://") || cat.img.startsWith("//"));
    return {
      ...cat,
      img: isExternalUrl ? cat.img : (fallback?.img || teesImg),
      to: cat.to || fallback?.to || "/shop",
      is_active: cat.is_active !== false,
    };
  });
}

export const getStoreCategoriesServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase.storage
      .from("product-images")
      .download("store_categories.json");

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeCategoriesWithDefaults(parsed);
      }
    }
  } catch (e: any) {
    console.warn("[getStoreCategoriesServer] Storage read exception:", e?.message);
  }
  return DEFAULT_CATEGORIES;
});

export const saveStoreCategoriesServer = createServerFn({ method: "POST" })
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
              .upload("store_categories.json", buffer, { upsert: true, contentType: "application/json" });
            return { ok: true };
          }
        } catch (_) {}
      }

      const { error } = await context.supabase.storage
        .from("product-images")
        .upload("store_categories.json", buffer, { upsert: true, contentType: "application/json" });

      if (error) {
        console.warn("[saveStoreCategoriesServer] user client error:", error.message);
      }
      return { ok: true };
    } catch (e: any) {
      console.warn("[saveStoreCategoriesServer] Storage write exception:", e?.message);
      return { ok: false, error: e?.message };
    }
  });

export function fetchLocalCategories(): StoreCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return mergeCategoriesWithDefaults(parsed);
    }
  } catch (e) {
    console.error("Failed to parse store categories from storage", e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(cats: StoreCategory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
    window.dispatchEvent(new CustomEvent("categories-updated", { detail: cats }));
  } catch (e) {
    console.error("Failed to save store categories to storage", e);
  }
}
