export type FallbackProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  inventory_count: number;
  image_urls: string[];
  sizes: string[];
  colors: string[];
  category: string;
  is_active?: boolean;
  created_at?: string;
};

const fallbackProducts: FallbackProduct[] = [
  {
    id: "fallback-tee",
    slug: "weekdayz-core-casual-tee",
    title: "Weekdayz Core Casual Tee",
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
    title: "Weekdayz Premium Oversized Hoodie",
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
    description: "Ee sala cup namde! Rep the Red & Gold in style with the official Weekdayz x RCB fan edition tee.",
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

export function getFallbackProducts(): FallbackProduct[] {
  return fallbackProducts;
}

export function getFallbackProductBySlug(slug: string): FallbackProduct | undefined {
  return fallbackProducts.find((product) => product.slug === slug);
}

export function getFallbackReviews() {
  return [
    {
      id: "fallback-review",
      rating: 5,
      body: "A strong fallback review while the live catalog is unavailable.",
      created_at: new Date().toISOString(),
      user_id: "fallback-user",
      profiles: { full_name: "Local Preview" },
    },
  ];
}
