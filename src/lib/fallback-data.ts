export type FallbackProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  compare_at_price_cents?: number | null;
  inventory_count: number;
  image_urls: string[];
  sizes: string[];
  colors: string[];
  category: string;
  is_active?: boolean;
  created_at?: string;
};

const coupleTeesDescription = `Celebrate your connection with matching Couple T-Shirts that are designed to turn everyday moments into lasting memories. Whether you're heading out for a coffee date, movie night, vacation, college, anniversary, or simply spending time together, these premium oversized tees let you wear your bond with confidence and style.

Crafted from 240 GSM French Terry fabric (97% Cotton, 3% Spandex), our Couple T-Shirts offer a soft feel, breathable comfort, and a structured oversized fit that looks great on everyone. Every design is printed using premium DTF technology, delivering sharp details, vibrant colours, and long-lasting durability.

Why You'll Love It:
• Premium 240 GSM French Terry Fabric (97% Cotton, 3% Spandex)
• Relaxed Oversized Fit
• High-Quality Premium DTF Print
• Soft, breathable, and durable
• Perfect for couples, gifting, anniversaries, birthdays, Valentine's Day, movie dates, vacations, and everyday wear

Product Details:
• Category: Couple T-Shirts
• Fit: Oversized
• Fabric: 240 GSM French Terry (97% Cotton, 3% Spandex)
• Print: Premium DTF Print
• Sizes Available: S, M, L, XL, XXL

Wash Care:
• Wash inside out with similar colours.
• Machine wash in cold water.
• Do not bleach.
• Do not iron directly on the print.
• Hang dry for the best print life.

Match your vibe. Create memories. Wear Weekdayzz.`;

let fallbackProducts: FallbackProduct[] = [
  {
    id: "fallback-calm-kaleshi",
    slug: "calm-admi-and-kaleshi-aurat-tees",
    title: "Calm Admi & Kaleshi Aurat Couple Tees",
    description: coupleTeesDescription,
    price_cents: 149800,
    inventory_count: 100,
    image_urls: [
      "/products/calm-admi-kaleshi-aurat-white.png",
      "/products/calm-admi-kaleshi-aurat-black.png",
      "/products/size-chart-oversized.png"
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Black"],
    category: "Couple T-Shirts",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  
  
  {
    id: "fallback-tee",
    slug: "weekdayz-core-casual-tee",
    title: "Weekdayzz Core Casual Tee",
    description: "The everyday essential. Clean silhouette, soft-washed cotton, and a relaxed boxy fit.",
    price_cents: 149900,
    inventory_count: 100,
    image_urls: ["/products/hero-cream.jpg"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Cream"],
    category: "Casuals",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-hoodie",
    slug: "weekdayz-premium-oversized-hoodie",
    title: "Weekdayzz Premium Oversized Hoodie",
    description: "400gsm fleece hoodie with dropped shoulders, kangaroo pocket, and a relaxed oversized silhouette.",
    price_cents: 349900,
    inventory_count: 40,
    image_urls: ["/products/hoodie-black.jpg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Charcoal"],
    category: "Hoodies",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-f1",
    slug: "f1-racewear-graphic-tee",
    title: "F1 Racewear Graphic Tee",
    description: "Rev up your wardrobe with this exclusive F1-inspired graphic tee.",
    price_cents: 199900,
    inventory_count: 50,
    image_urls: ["/products/f1-hero.jpg"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    category: "F1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "fallback-rcb",
    slug: "rcb-fan-edition-tee",
    title: "RCB Fan Edition Tee",
    description: "Ee sala cup namde! Rep the Red & Gold in style with the official Weekdayzz x RCB fan edition tee.",
    price_cents: 199900,
    inventory_count: 60,
    image_urls: ["/products/rcb-hero.jpg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Red", "Gold"],
    category: "RCB",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

import { getPublicClient } from "@/lib/supabase-server";

let CUSTOM_FALLBACK_PRODUCTS: FallbackProduct[] = [];
let DELETED_PRODUCT_IDS: Set<string> = new Set();

const STORAGE_BUCKET = "product-images";
const STORAGE_PATH = "custom_products.json";

export async function fetchStorageCustomProducts(): Promise<FallbackProduct[]> {
  try {
    const supabase = getPublicClient();
    // product-images bucket is public readable per RLS policy
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_PATH);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        let storageProducts: FallbackProduct[] = [];
        let storageDeletedIds: string[] = [];

        // Support both array format (legacy) and object format { products, deletedIds }
        if (Array.isArray(parsed)) {
          storageProducts = parsed;
        } else {
          storageProducts = parsed.products || [];
          storageDeletedIds = parsed.deletedIds || [];
        }

        // Merge: keep any in-memory products that aren't in storage yet
        // (handles the case where a product was added to memory but the storage upload failed)
        const storageIds = new Set(storageProducts.map((p) => p.id));
        const storageSlugs = new Set(storageProducts.map((p) => p.slug));
        const memoryOnlyProducts = CUSTOM_FALLBACK_PRODUCTS.filter(
          (p) => !storageIds.has(p.id) && !storageSlugs.has(p.slug)
        );

        CUSTOM_FALLBACK_PRODUCTS = [...memoryOnlyProducts, ...storageProducts];
        // Merge deleted IDs — keep any already-tracked deletions
        const mergedDeletedIds = new Set([...DELETED_PRODUCT_IDS, ...storageDeletedIds]);
        DELETED_PRODUCT_IDS = mergedDeletedIds;

        return CUSTOM_FALLBACK_PRODUCTS;
      }
    }
    if (error) {
      console.warn("[fetchStorageCustomProducts]", error.message);
    }
  } catch (e: any) {
    console.warn("[fetchStorageCustomProducts] exception:", e?.message);
  }
  // On failure, preserve existing in-memory products instead of returning empty
  return CUSTOM_FALLBACK_PRODUCTS;
}

function getStoragePayload(): string {
  return JSON.stringify({
    products: CUSTOM_FALLBACK_PRODUCTS,
    deletedIds: [...DELETED_PRODUCT_IDS],
  }, null, 2);
}

export async function saveStorageCustomProducts(product: FallbackProduct, client?: any, adminClient?: any): Promise<void> {
  addCustomFallbackProduct(product);
  // Remove from deleted set if re-adding
  DELETED_PRODUCT_IDS.delete(product.id);
  DELETED_PRODUCT_IDS.delete(product.slug);
  // Fetch existing to merge
  await fetchStorageCustomProducts();
  addCustomFallbackProduct(product);
  DELETED_PRODUCT_IDS.delete(product.id);
  DELETED_PRODUCT_IDS.delete(product.slug);
  
  const buffer = Buffer.from(getStoragePayload(), "utf-8");

  // Try with authenticated client first (required by RLS: admin role check)
  if (client) {
    try {
      const { error } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(STORAGE_PATH, buffer, { upsert: true, contentType: "application/json" });
      if (!error) return;
      console.warn("[saveStorageCustomProducts] auth client error:", error.message);
    } catch (e: any) {
      console.warn("[saveStorageCustomProducts] auth client exception:", e?.message);
    }
  }

  // Try with admin/service-role client (bypasses RLS)
  if (adminClient) {
    try {
      const { error } = await adminClient.storage
        .from(STORAGE_BUCKET)
        .upload(STORAGE_PATH, buffer, { upsert: true, contentType: "application/json" });
      if (!error) {
        console.log("[saveStorageCustomProducts] Saved via admin client");
        return;
      }
      console.warn("[saveStorageCustomProducts] admin client error:", error.message);
    } catch (e: any) {
      console.warn("[saveStorageCustomProducts] admin client exception:", e?.message);
    }
  }

  // Fallback: try public client
  try {
    const supabase = getPublicClient();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, buffer, { upsert: true, contentType: "application/json" });
    if (error) {
      console.warn("[saveStorageCustomProducts] public client error:", error.message);
    }
  } catch (e: any) {
    console.warn("[saveStorageCustomProducts] public exception:", e?.message);
  }
}

export async function removeStorageCustomProduct(id: string, client?: any): Promise<void> {
  // Add to deleted set so it stays hidden across serverless restarts
  DELETED_PRODUCT_IDS.add(id);
  deleteCustomFallbackProduct(id);
  
  const buffer = Buffer.from(getStoragePayload(), "utf-8");
  const supabase = client || getPublicClient();

  try {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, buffer, { upsert: true, contentType: "application/json" });
  } catch (e: any) {
    console.warn("[removeStorageCustomProduct] error:", e?.message);
  }
}

export function getFallbackProducts(): FallbackProduct[] {
  return [...CUSTOM_FALLBACK_PRODUCTS, ...fallbackProducts].filter(
    (p) => !DELETED_PRODUCT_IDS.has(p.id) && !DELETED_PRODUCT_IDS.has(p.slug)
  );
}

export function getFallbackProductBySlug(slug: string): FallbackProduct | undefined {
  return getFallbackProducts().find((product) => product.slug === slug);
}

export function addCustomFallbackProduct(product: FallbackProduct) {
  CUSTOM_FALLBACK_PRODUCTS = [
    product,
    ...CUSTOM_FALLBACK_PRODUCTS.filter((p) => p.id !== product.id && p.slug !== product.slug),
  ];
}

export function updateCustomFallbackProduct(id: string, updates: Partial<FallbackProduct>) {
  CUSTOM_FALLBACK_PRODUCTS = CUSTOM_FALLBACK_PRODUCTS.map((p) => (p.id === id ? { ...p, ...updates } : p));
  const idx = fallbackProducts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    fallbackProducts[idx] = { ...fallbackProducts[idx], ...updates };
  }
}

export function deleteCustomFallbackProduct(id: string) {
  CUSTOM_FALLBACK_PRODUCTS = CUSTOM_FALLBACK_PRODUCTS.filter((p) => p.id !== id && p.slug !== id);
  fallbackProducts = fallbackProducts.filter((p) => p.id !== id && p.slug !== id);
}

export function decrementFallbackInventory(idOrSlug: string, qty: number) {
  CUSTOM_FALLBACK_PRODUCTS = CUSTOM_FALLBACK_PRODUCTS.map((p) => {
    if (p.id === idOrSlug || p.slug === idOrSlug) {
      return { ...p, inventory_count: Math.max(0, p.inventory_count - qty) };
    }
    return p;
  });

  fallbackProducts = fallbackProducts.map((p) => {
    if (p.id === idOrSlug || p.slug === idOrSlug) {
      return { ...p, inventory_count: Math.max(0, p.inventory_count - qty) };
    }
    return p;
  });
}

export type FallbackReview = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

const fallbackReviews: FallbackReview[] = [
  {
    id: "fb-rev-1",
    rating: 5,
    body: "Exceptional quality and incredible fit! Highly recommended.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    user_id: "user-fb-1",
    profiles: {
      full_name: "Alex M.",
    },
  },
  {
    id: "fb-rev-2",
    rating: 4,
    body: "Super soft material, very comfortable for daily wear.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    user_id: "user-fb-2",
    profiles: {
      full_name: "Jordan K.",
    },
  },
];

export function getFallbackReviews(): FallbackReview[] {
  return fallbackReviews;
}



