import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Weekdayz" },
      { name: "description", content: "Search the Weekdayz catalog. Find your next fit." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: allProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });

  const results = debouncedQ
    ? (allProducts ?? []).filter(
        (p) =>
          p.title.toLowerCase().includes(debouncedQ) ||
          p.description.toLowerCase().includes(debouncedQ) ||
          p.category.toLowerCase().includes(debouncedQ)
      )
    : [];

  const SUGGESTIONS = ["tee", "hoodie", "black", "oversized", "graphic"];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">Search</span>
        <h1 className="text-display text-5xl sm:text-7xl mt-2">Find Your Fit.</h1>
      </div>

      {/* Search Input */}
      <div className="relative mb-10">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tees, hoodies, graphics…"
          className="w-full bg-card border border-border pl-12 pr-12 py-5 text-lg focus:outline-none focus:border-accent transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:text-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* No query state */}
      {!debouncedQ && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="inline-flex items-center gap-1.5 border border-border px-4 py-2 text-sm uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
              >
                {s} <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {debouncedQ && (
          <motion.div
            key={debouncedQ}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {results.length > 0 ? (
              <>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                  {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                </p>
                <div className="grid gap-6 sm:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <p className="text-2xl font-semibold">No drops found.</p>
                <p className="text-muted-foreground mt-2 text-sm">Try a different search term.</p>
                <Link
                  to="/shop"
                  className="inline-block mt-6 text-accent uppercase text-xs tracking-widest underline"
                >
                  Browse all drops
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
