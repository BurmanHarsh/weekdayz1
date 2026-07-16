import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useCurrencyStore, type Currency } from "@/lib/currency-store";

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
  const pathname = router.state.location.pathname;
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-24">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Weekdayz" className="h-20 w-auto" />
        </Link>

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
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "text-sm uppercase tracking-widest font-medium transition-colors hover:text-accent",
                pathname.startsWith("/admin") && "text-accent",
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/search" className="p-2 hover:text-accent transition-colors" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <Link to={user ? "/account" : "/auth"} className="p-2 hover:text-accent transition-colors" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative p-2 hover:text-accent transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          {/* Currency Switcher */}
          <div className="relative group hidden sm:block">
            <button className="text-xs uppercase tracking-widest font-semibold border border-border px-2.5 py-1 hover:border-accent hover:text-accent transition-colors">
              {currency}
            </button>
            <div className="absolute right-0 top-full mt-1 bg-card border border-border py-1 hidden group-hover:block w-20 shadow-xl">
              {(["INR", "USD", "EUR"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "w-full text-left px-3 py-1 text-xs hover:bg-secondary transition-colors uppercase tracking-widest",
                    currency === c && "text-accent font-bold"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

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
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="text-sm uppercase tracking-widest font-medium">
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
                  currency === c && "border-accent text-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
