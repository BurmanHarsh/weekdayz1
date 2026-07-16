import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Package, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { myOrders } from "@/lib/orders.functions";
import { myWishlist } from "@/lib/wishlist.functions";
import { myDesigns } from "@/lib/designs.functions";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { ProductCard } from "@/components/shop/ProductCard";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Weekdayz" },
      { name: "description", content: "Your Weekdayz account, orders, and saved designs." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => myOrders(),
    enabled: Boolean(user),
  });

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: () => myWishlist(),
    enabled: Boolean(user),
  });

  const { data: designs } = useQuery({
    queryKey: ["my-designs", user?.id],
    queryFn: () => myDesigns(),
    enabled: Boolean(user),
  });

  if (!user) return null;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Account</span>
          <h1 className="text-display text-5xl mt-2">Hi, {user.email?.split("@")[0]}</h1>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Link to="/admin" className="border border-accent text-accent px-4 py-2 text-xs uppercase tracking-widest font-semibold">
              Admin
            </Link>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* Orders Section */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Orders</h2>
        {!orders?.length ? (
          <div className="border border-border p-10 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link to="/shop" className="inline-block mt-4 text-accent uppercase text-xs tracking-widest underline">Start shopping</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {orders.map((o) => (
              <li key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    {new Date(o.created_at).toLocaleDateString()} · {o.fulfillment_status} · {o.payment_status}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(o.total_cents)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Wishlist Section */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Wishlist</h2>
        {!wishlist?.length ? (
          <div className="border border-border p-10 text-center">
            <Heart className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((item: any) => (
              <ProductCard
                key={item.product_id}
                product={{
                  id: item.products.id,
                  slug: item.products.slug,
                  title: item.products.title,
                  price_cents: item.products.price_cents,
                  image_urls: item.products.image_urls,
                  category: item.products.category,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved Designs Section */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Saved Designs</h2>
        {!designs?.length ? (
          <div className="border border-border p-10 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No saved designs yet.</p>
            <Link to="/create" className="inline-block mt-4 text-accent uppercase text-xs tracking-widest underline">Create custom design</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((d) => (
              <div key={d.id} className="border border-border bg-card p-4 flex gap-4 items-center">
                <div className="relative w-20 h-20 bg-muted flex-shrink-0 border border-border">
                  <img src={d.design_file_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Custom Tee</h3>
                  <p className="text-xs text-muted-foreground mt-1">Color: {d.base_color}</p>
                  <p className="text-xs text-muted-foreground">Created: {new Date(d.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => {
                      addItem({
                        custom_design_id: d.id,
                        title: `Custom Tee · ${d.base_color}`,
                        image: d.design_file_url,
                        size: "L",
                        unit_price_cents: 209900,
                      });
                      toast.success("Added custom tee to bag");
                    }}
                    className="mt-2 text-xs text-accent uppercase tracking-widest font-semibold hover:underline"
                  >
                    Re-add to bag
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bootstrap Section */}
      <AdminBootstrap />
    </div>
  );
}

function AdminBootstrap() {
  const [secret, setSecret] = useState("");
  const bootstrapFn = useServerFn(bootstrapAdmin);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bootstrapFn({ data: { secret } });
      toast.success("You are now an admin!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bootstrap admin");
    }
  };

  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Bootstrap Admin</h2>
      <p className="text-xs text-muted-foreground mb-4">Promote yourself to admin. Default secret: <code>weekdayz-secret-1337</code></p>
      <form onSubmit={handleBootstrap} className="flex gap-2 max-w-md">
        <input
          type="password"
          placeholder="Enter bootstrap secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="flex-1 bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <button type="submit" className="bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-widest font-semibold">
          Promote
        </button>
      </form>
    </section>
  );
}
