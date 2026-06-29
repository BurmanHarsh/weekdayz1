import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

const productsQ = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/shop")({
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

function Shop() {
  const { data } = useSuspenseQuery(productsQ);
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (category && p.category !== category) return false;
      if (size && !p.sizes.includes(size)) return false;
      if (p.price_cents > maxPrice * 100) return false;
      return true;
    });
  }, [data, category, size, maxPrice]);

  const Filters = (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest border ${
                category === c ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-accent"
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
              className={`min-w-10 px-3 py-1.5 text-xs uppercase tracking-widest border ${
                size === s ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Max Price · ₹{maxPrice}</h3>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
      </div>
      {(category || size || maxPrice < 5000) && (
        <button
          onClick={() => {
            setCategory(null);
            setSize(null);
            setMaxPrice(5000);
          }}
          className="text-xs uppercase tracking-widest text-accent hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Shop</span>
          <h1 className="text-display text-5xl sm:text-7xl mt-2">All Drops.</h1>
          <p className="text-muted-foreground mt-2">{filtered.length} pieces available</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
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

      {/* Mobile filter sheet */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border p-6 rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-display text-xl">Filters</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            {Filters}
          </div>
        </>
      )}
    </div>
  );
}
