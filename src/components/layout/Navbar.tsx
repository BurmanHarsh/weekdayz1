import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, Search, Heart } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useCurrencyStore, type Currency } from "@/lib/currency-store";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { getWishlistIds, myWishlist } from "@/lib/wishlist.functions";
import { useServerFn } from "@tanstack/react-start";
import { formatPrice } from "@/lib/format";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/create", label: "Create" },
  { to: "/account", label: "Account" },
] as const;

export function Navbar() {
  const items = useCart((s) => s.items);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();
  const pathname = router.state.location.pathname;
  const { currency, setCurrency } = useCurrencyStore();

  // Search state
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Scroll-hide state
  const [scrolledDown, setScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      if (currentY < 10) {
        // Always show near top
        setScrolledDown(false);
      } else if (currentY > lastScrollY.current + 4) {
        // Scrolling down
        setScrolledDown(true);
      } else if (currentY < lastScrollY.current - 4) {
        // Scrolling up
        setScrolledDown(false);
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const listProductsFn = useServerFn(listProducts);
  const getWishlistIdsFn = useServerFn(getWishlistIds);
  const myWishlistFn = useServerFn(myWishlist);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
    staleTime: 60_000,
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => myWishlistFn(),
    enabled: !!user,
  });

  const wishCount = wishlist.length;

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as typeof products;
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [q, products]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  function submitSearch(term: string) {
    const t = term.trim();
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setQ("");
    navigate({ to: "/search", search: t ? { q: t } : {} });
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex flex-col",
        scrolledDown ? "header-scrolled-down" : "header-scrolled-up",
      )}
    >
      {/* ── Main navbar ── */}
      <div className="backdrop-blur-xl bg-background/95 border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16 md:h-20">

          {/* ── LEFT: Hamburger + Search ── */}
          <div className="flex items-center gap-1 w-1/3">
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 hover:text-accent transition-colors rounded-none"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Search icon (mobile) */}
            <button
              className="p-2 hover:text-accent transition-colors"
              aria-label="Search"
              onClick={() => setMobileSearchOpen((v) => !v)}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Search desktop */}
            <div ref={searchRef} className="relative hidden lg:block ml-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch(q);
                }}
                className="flex items-center gap-2 border border-border bg-secondary/80 px-3 py-1.5 w-52 xl:w-64"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search tees, hoodies…"
                  className="bg-transparent text-xs outline-none w-full"
                />
              </form>

              {searchOpen && q.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1 border border-border bg-background shadow-lg overflow-hidden z-50">
                  {suggestions.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-muted-foreground">
                      No matches — press Enter to search anyway.
                    </div>
                  ) : (
                    <ul className="max-h-80 overflow-auto">
                      {suggestions.map((p) => (
                        <li key={p.id}>
                          <Link
                            to="/product/$slug"
                            params={{ slug: p.slug }}
                            onClick={() => {
                              setSearchOpen(false);
                              setQ("");
                            }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors"
                          >
                            <img
                              src={p.image_urls[0]}
                              alt=""
                              className="h-12 w-10 object-cover border border-border"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold">
                                {p.title}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                                {p.category}
                              </div>
                            </div>
                            <div className="text-sm font-bold">
                              {formatPrice(p.price_cents)}
                            </div>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => submitSearch(q)}
                          className="w-full border-t border-border px-4 py-2 text-left text-xs font-bold tracking-widest text-foreground hover:bg-secondary"
                        >
                          SEE ALL RESULTS FOR "{q}" →
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── CENTER: WEEKDAYZZ Logo ── */}
          <div className="flex-1 flex justify-center">
            <Link to="/" className="flex items-center group py-1" aria-label="WEEKDAYZZ Home">
              <img
                src="/logo.png"
                alt="WEEKDAYZZ"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain max-h-16 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-md"
              />
            </Link>
          </div>

          {/* ── RIGHT: User, Wishlist, Cart ── */}
          <div className="flex items-center justify-end gap-1 w-1/3">
            {/* Account */}
            <Link
              to={user ? (isAdmin ? "/admin" : "/account") : "/auth"}
              className="p-2 hover:text-accent transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>

            {/* Wishlist */}
            <Link
              to={user ? "/wishlist" : "/auth"}
              className="relative p-2 hover:text-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {user && wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-bold h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full">
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2 hover:text-accent transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-bold h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </button>

            {/* Currency Switcher — desktop only */}
            <div className="relative group hidden xl:block">
              <button className="text-[10px] uppercase tracking-widest font-semibold border border-border px-2 py-1 hover:border-foreground hover:text-foreground transition-colors">
                {currency}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border py-1 hidden group-hover:block w-20 shadow-xl z-50">
                {(["INR", "USD", "EUR"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "w-full text-left px-3 py-1 text-xs hover:bg-secondary transition-colors uppercase tracking-widest",
                      currency === c && "text-foreground font-bold",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search bar — slides down when toggled */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-border px-4 py-3 bg-background/95">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(q);
              }}
              className="flex items-center gap-2 border border-border bg-secondary px-3 py-2 w-full"
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tees, hoodies, RCB…"
                className="bg-transparent text-sm outline-none flex-1"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* Hamburger menu drawer */}
        {menuOpen && (
          <nav className="border-t border-border px-4 py-5 flex flex-col gap-4 bg-background/95">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "text-sm uppercase tracking-widest font-semibold transition-colors hover:text-foreground/70 py-1",
                  pathname.startsWith(l.to) && "border-b-2 border-foreground pb-1",
                )}
              >
                {l.label}
              </Link>
            ))}

            {/* Currency switcher in menu */}
            <div className="flex gap-2 pt-3 border-t border-border">
              {(["INR", "USD", "EUR"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "text-xs border border-border px-2.5 py-1 uppercase tracking-widest font-semibold",
                    currency === c && "border-foreground text-foreground bg-foreground/5",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
