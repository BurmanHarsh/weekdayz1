import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { z } from "zod";

const productsQ = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

const shopSearchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Shop All Drops — Weekdayz" },
      { name: "description", content: "Browse the full Weekdayz catalog of premium tees, oversized fits, and hoodies." },
      { property: "og:title", content: "Shop All Drops — Weekdayz" },
      { property: "og:description", content: "Premium streetwear catalog. Filter by size, color, and price." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQ),
  component: Shop,
});

const CATEGORIES = ["tee", "hoodie"] as const;
const SIZES = ["S", "M", "L", "XL", "XXL"];

function ShopHeaderBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#ebebeb] border border-border shadow-md mb-10">
      <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[280px] md:min-h-[340px]">
        {/* Left Side: Clothing Hangers Image */}
        <div className="md:col-span-7 relative h-64 md:h-full w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop"
            alt="WEEKDAYZZ Collection"
            className="h-full w-full object-cover object-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#ebebeb] hidden md:block" />
        </div>

        {/* Right Side: Typography */}
        <div className="md:col-span-5 p-8 md:p-12 space-y-3 text-foreground z-10">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            — Collections
          </div>
          <h2 className="text-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
            Explore The Various Collection of WEEKDAYZZ Collection
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            Don&apos;t miss out to shopping collection from us! you&apos;ll not be let down.
          </p>
        </div>
      </div>
    </div>
  );
}

function Shop() {
  const { data } = useSuspenseQuery(productsQ);
  const { category: initialCategory } = Route.useSearch();
  const [category, setCategory] = useState<string | null>(initialCategory || null);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<"new" | "price_asc" | "price_desc">("new");

  const allColors = useMemo(() => {
    const set = new Set<string>();
    data.forEach((p) => p.colors?.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    let list = data.filter((p) => {
      if (category && p.category !== category) return false;
      if (size && !p.sizes.includes(size)) return false;
      if (color && !p.colors?.includes(color)) return false;
      if (p.price_cents > maxPrice * 100) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(t) ||
          p.category.toLowerCase().includes(t) ||
          (p.description ?? "").toLowerCase().includes(t);
        if (!matches) return false;
      }
      return true;
    });
    if (sort === "price_asc") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    if (sort === "price_desc") list = [...list].sort((a, b) => b.price_cents - a.price_cents);
    return list;
  }, [data, category, size, color, maxPrice, searchTerm, sort]);

  const Filters = (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
                category === c ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(size === s ? null : s)}
              className={`min-w-10 px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
                size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {allColors.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Color Variant</h3>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(color === c ? null : c)}
                className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
                  color === c ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Max Price · ₹{maxPrice}</h3>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--color-foreground)]"
        />
      </div>
      {(category || size || maxPrice < 5000 || searchTerm) && (
        <button
          onClick={() => {
            setCategory(null);
            setSize(null);
            setMaxPrice(5000);
            setSearchTerm("");
          }}
          className="text-xs uppercase tracking-widest text-foreground hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Top Store Banner */}
      <ShopHeaderBanner />

      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Store</span>
          <h1 className="text-display text-4xl sm:text-6xl mt-1 font-black">All Drops.</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} pieces available</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest font-semibold focus:outline-none focus:border-accent"
          >
            <option value="new">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-accent transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-8 relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products, categories…"
          className="w-full border border-border bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden lg:block sticky top-24 self-start">{Filters}</aside>

        <div className="grid gap-6 sm:gap-8 grid-cols-2 md:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-20">No drops match these filters.</p>
          )}
        </div>
      </div>

      {/* Mobile filter sheet with slide-up animations */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border p-6 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Drag handle bar at top of sheet */}
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-display text-xl">Filters</h2>
                <button onClick={() => setOpen(false)} className="p-1 hover:text-accent transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {Filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
