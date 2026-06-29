import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

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

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-16">
        <Link to="/" className="text-display text-2xl tracking-tighter">
          WEEKDAYZ<span className="text-accent">.</span>
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
        </nav>
      )}
    </header>
  );
}
