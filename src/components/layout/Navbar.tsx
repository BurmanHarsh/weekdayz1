import { Link, useRouter, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, Search, Heart, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useCurrencyStore, type Currency } from "@/lib/currency-store";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { getWishlistIds } from "@/lib/wishlist.functions";
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
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();
  const pathname = router.state.location.pathname;
  const { currency, setCurrency } = useCurrencyStore();

  // Search state
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const listProductsFn = useServerFn(listProducts);
  const getWishlistIdsFn = useServerFn(getWishlistIds);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
    staleTime: 60_000,
  });

  const { data: wishlistIds = [] } = useQuery({
    queryKey: ["wishlist-ids"],
    queryFn: () => getWishlistIdsFn(),
    enabled: !!user,
  });

  const wishCount = wishlistIds.length;

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as typeof products;
    return products
      .filter(
        (p) => p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term),
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
    setQ("");
    navigate({ to: "/search", search: t ? { q: t } : {} });
  }

  return (
    <header className="sticky top-0 z-50 flex flex-col">
      {/* ── Announcement bar ── */}
      <div
        className="w-full text-center text-[11px] font-semibold tracking-[0.18em] py-2 px-4 uppercase"
        style={{ background: "var(--brand-ink)", color: "var(--color-cream)" }}
      >
        FREE SHIPPING OVER ₹999 &nbsp;·&nbsp; EASY 15-DAY RETURNS &nbsp;·&nbsp; COD AVAILABLE
      </div>

      {/* ── Main navbar ── */}
      <div className="backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Weekdayz" className="h-16 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "text-sm uppercase tracking-widest font-medium transition-colors hover:text-accent",
                  pathname.startsWith(l.to) && "text-accent",
                )}
              >
                {l.label}
              </Link>
            ))}
            {(isAdmin || pathname.startsWith("/admin")) && (
              <Link
                to="/admin"
                className={cn(
                  "text-sm uppercase tracking-widest font-bold text-accent px-3 py-1 bg-accent/15 border border-accent/40 rounded transition-all hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 shadow-sm",
                  pathname.startsWith("/admin") && "bg-accent text-accent-foreground border-accent font-black shadow-md",
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search — desktop dropdown */}
            <div ref={searchRef} className="relative hidden md:block">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch(q);
                }}
                className="flex items-center gap-2 border border-border bg-secondary px-3 py-2 w-56 lg:w-72"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search tees, hoodies, RCB…"
                  className="bg-transparent text-sm outline-none w-full"
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
                              <div className="truncate text-sm font-semibold">{p.title}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                                {p.category}
                              </div>
                            </div>
                            <div className="text-sm font-bold">{formatPrice(p.price_cents)}</div>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => submitSearch(q)}
                          className="w-full border-t border-border px-4 py-2 text-left text-xs font-bold tracking-widest text-accent hover:bg-secondary"
                        >
                          SEE ALL RESULTS FOR "{q}" →
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Search icon — mobile */}
            <Link
              to="/search"
              className="md:hidden p-2 hover:text-accent transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

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
              to={user ? "/account" : "/auth"}
              className="relative p-2 hover:text-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {user && wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold h-5 min-w-5 px-1 flex items-center justify-center">
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
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold h-5 min-w-5 px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            {/* Currency Switcher */}
            <div className="relative group hidden sm:block">
              <button className="text-xs uppercase tracking-widest font-semibold border border-border px-2.5 py-1 hover:border-accent hover:text-accent transition-colors">
                {currency}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border py-1 hidden group-hover:block w-20 shadow-xl z-50">
                {(["INR", "USD", "EUR"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "w-full text-left px-3 py-1 text-xs hover:bg-secondary transition-colors uppercase tracking-widest",
                      currency === c && "text-accent font-bold",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="md:hidden border-t border-border px-4 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-widest font-medium"
              >
                {l.label}
              </Link>
            ))}

            {(isAdmin || pathname.startsWith("/admin") || !!user) && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-widest font-black text-accent bg-accent/15 border-2 border-accent px-3 py-2 flex items-center gap-1.5 w-fit my-1"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}

            {/* Mobile currency Switcher */}
            <div className="flex gap-2 pt-2 border-t border-border">
              {(["INR", "USD", "EUR"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c);
                    setOpen(false);
                  }}
                  className={cn(
                    "text-xs border border-border px-2.5 py-1 uppercase tracking-widest font-semibold",
                    currency === c && "border-accent text-accent",
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
