import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, ArrowRight, SlidersHorizontal, ChevronDown, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Catalog — Weekdayz" },
      { name: "description", content: "Search and filter the Weekdayz catalog by category, price, and size." },
    ],
  }),
  component: SearchPage,
});

const PRESET_CATEGORIES = ["all", "hoodie", "tshirt", "shirt", "pant", "cargo"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "Lower->Higher", label: "Price: Low to High" },
  { id: "Higher->Lower", label: "Price: High to Low" },
  { id: "newest", label: "Newest Drops" },
];

function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState("relevance");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: allProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });

  // Dynamically extract all available categories from products
  const categoryList = useMemo(() => {
    const existing = (allProducts ?? []).map((p) => p.category?.toLowerCase()?.trim()).filter(Boolean);
    return Array.from(new Set([...PRESET_CATEGORIES, ...existing]));
  }, [allProducts]);

  // Amazon/Flipkart Filter & Search Processor
  const filteredAndSortedResults = useMemo(() => {
    let list = [...(allProducts ?? [])];

    // 1. Text Search query
    if (debouncedQ) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(debouncedQ) ||
          p.description.toLowerCase().includes(debouncedQ) ||
          (p.category ?? "").toLowerCase().includes(debouncedQ) ||
          p.slug.toLowerCase().includes(debouncedQ)
      );
    }

    // 2. Category Filter
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => (p.category ?? "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Size Filter
    if (selectedSize) {
      list = list.filter((p) => p.sizes?.includes(selectedSize));
    }

    // 4. Max Price Filter
    list = list.filter((p) => p.price_cents <= maxPrice * 100);

    // 5. Sort By
    if (sortBy === "Lower->Higher") {
      list.sort((a, b) => a.price_cents - b.price_cents);
    } else if (sortBy === "Higher->Lower") {
      list.sort((a, b) => b.price_cents - a.price_cents);
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime());
    }

    return list;
  }, [allProducts, debouncedQ, selectedCategory, selectedSize, maxPrice, sortBy]);

  const hasActiveFilters =
    Boolean(debouncedQ) ||
    selectedCategory !== "all" ||
    selectedSize !== null ||
    maxPrice < 5000 ||
    sortBy !== "relevance";

  const clearAllFilters = () => {
    setQuery("");
    setDebouncedQ("");
    setSelectedCategory("all");
    setSelectedSize(null);
    setMaxPrice(5000);
    setSortBy("relevance");
  };

  const SUGGESTIONS = ["tee", "hoodie", "f1", "oversized", "rcb", "casuals"];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Search & Discover</span>
        <h1 className="text-display text-4xl sm:text-6xl mt-1">Find what you're looking for</h1>
      </div>

      {/* Amazon / Flipkart Style Integrated Search Box */}
      <div className="relative mb-8">
        <div className="flex flex-col sm:flex-row border-2 border-border bg-card shadow-lg focus-within:border-accent transition-colors">
          {/* Flipkart / Amazon Category Dropdown Selector */}
          <div className="relative border-b sm:border-b-0 sm:border-r border-border bg-secondary/40 sm:w-56 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((v) => !v)}
              className="w-full h-full px-4 py-3 text-xs uppercase font-bold tracking-wider text-left flex items-center justify-between hover:bg-secondary transition-colors"
            >
              <span className="truncate">
                {selectedCategory === "all" ? "All Categories" : selectedCategory.toUpperCase()}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${
                  isCategoryDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 sm:w-64 z-50 bg-card border border-border max-h-60 overflow-y-auto shadow-2xl divide-y divide-border/40">
                {categoryList.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs uppercase font-bold tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                      selectedCategory === c ? "bg-accent/10 text-accent font-extrabold" : "text-foreground"
                    }`}
                  >
                    <span>{c === "all" ? "All Categories" : c.toUpperCase()}</span>
                    {selectedCategory === c && <Check className="h-3.5 w-3.5 text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Field */}
          <div className="relative flex-1 flex items-center">
            <SearchIcon className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tees, hoodies, F1 capsules, oversized fits…"
              className="w-full bg-transparent pl-12 pr-10 py-4 text-base focus:outline-none placeholder:text-muted-foreground/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDebouncedQ("");
                }}
                className="absolute right-4 p-1 hover:text-accent transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Flipkart / Amazon Primary Action Search Button */}
          <button
            type="button"
            onClick={() => setDebouncedQ(query.trim().toLowerCase())}
            className="bg-accent text-accent-foreground px-8 py-4 text-xs uppercase font-bold tracking-widest hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <SearchIcon className="h-4 w-4" /> Search
          </button>
        </div>
      </div>

      {/* Flipkart / Amazon Multi-Filter Bar */}
      <div className="border border-border bg-card p-4 space-y-4 mb-8 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <span className="text-xs uppercase tracking-widest font-bold text-foreground">Filter & Refine</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-accent font-semibold hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Quick Chips */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-xs uppercase font-bold tracking-wider"
            >
              {categoryList.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "ALL CATEGORIES" : c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter Pills */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
              Filter by Size
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                  className={`px-2.5 py-1 text-xs uppercase font-bold tracking-wider border transition-colors ${
                    selectedSize === s
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                Max Price
              </label>
              <span className="text-xs font-mono font-bold text-accent">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)] cursor-pointer"
            />
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
              Sort Results By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-xs uppercase font-bold tracking-wider"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Active Filters:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/40 text-accent text-[11px] uppercase font-bold px-2.5 py-0.5">
                Category: {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory("all")}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </span>
            )}
            {selectedSize && (
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/40 text-accent text-[11px] uppercase font-bold px-2.5 py-0.5">
                Size: {selectedSize}
                <button type="button" onClick={() => setSelectedSize(null)}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </span>
            )}
            {maxPrice < 5000 && (
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/40 text-accent text-[11px] uppercase font-bold px-2.5 py-0.5">
                Max ₹{maxPrice}
                <button type="button" onClick={() => setMaxPrice(5000)}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </span>
            )}
            {sortBy !== "relevance" && (
              <span className="inline-flex items-center gap-1 bg-accent/10 border border-accent/40 text-accent text-[11px] uppercase font-bold px-2.5 py-0.5">
                Sort: {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                <button type="button" onClick={() => setSortBy("relevance")}>
                  <X className="h-3 w-3 hover:text-foreground" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Preset Suggestions when search is empty */}
      {!debouncedQ && selectedCategory === "all" && !selectedSize && maxPrice === 5000 && (
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Trending Searches</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setDebouncedQ(s);
                }}
                className="inline-flex items-center gap-1.5 border border-border bg-card px-4 py-2 text-xs uppercase tracking-widest font-bold hover:border-accent hover:text-accent transition-colors"
              >
                {s} <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Results Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${debouncedQ}-${selectedCategory}-${selectedSize}-${maxPrice}-${sortBy}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              {filteredAndSortedResults.length} drop{filteredAndSortedResults.length !== 1 ? "s" : ""} found
              {debouncedQ ? ` for "${query}"` : ""}
            </p>
          </div>

          {filteredAndSortedResults.length > 0 ? (
            <div className="grid gap-6 sm:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredAndSortedResults.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border bg-card p-10 space-y-3">
              <p className="text-2xl font-bold">No matching products found.</p>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Try loosening your filters or searching for terms like "tee", "hoodie", or "oversized".
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-block mt-4 bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
