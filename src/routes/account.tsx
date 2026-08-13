import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Package, Heart, Sparkles, ChevronRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { myOrders } from "@/lib/orders.functions";
import { myWishlist } from "@/lib/wishlist.functions";
import { myDesigns } from "@/lib/designs.functions";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { ProductCard } from "@/components/shop/ProductCard";
import { LoyaltyStampCard } from "@/components/site/LoyaltyStampCard";

type Tab = "orders" | "wishlist" | "designs";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const tabStr = typeof search.tab === "string" ? search.tab : undefined;
    return {
      tab: tabStr === "wishlist" || tabStr === "designs" || tabStr === "orders" ? tabStr : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Account — WEEKDAYZZ" },
      { name: "description", content: "Your WEEKDAYZZ account, orders, and saved designs." },
    ],
  }),
  component: AccountPage,
});

function DesignImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase.storage
          .from("user-graphics")
          .createSignedUrl(path, 60 * 60);
        if (error) throw error;
        if (active && data) setUrl(data.signedUrl);
      } catch (err) {
        console.error("Failed to load signed URL for design:", err);
      }
    }
    load();
    return () => { active = false; };
  }, [path]);

  if (!url) {
    return <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">Loading...</div>;
  }

  return <img src={url} alt="Saved design" className="w-full h-full object-cover" />;
}

function AccountPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const { tab: searchTab } = Route.useSearch();
  const [activeTab, setActiveTab] = useState<Tab>(searchTab ?? "orders");

  useEffect(() => {
    if (searchTab) {
      setActiveTab(searchTab);
    }
  }, [searchTab]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
    } else if (isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [loading, user, isAdmin, navigate]);

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

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "orders", label: "Orders", icon: <Package className="h-4 w-4" />, count: orders?.length },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4" />, count: wishlist?.length },
    { id: "designs", label: "Saved Designs", icon: <Sparkles className="h-4 w-4" />, count: designs?.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-2xl font-black text-primary uppercase">
                  {user.email?.charAt(0)}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Account</span>
                <h1 className="text-display text-3xl sm:text-4xl mt-0.5 font-black">
                  Hi, {user.email?.split("@")[0]} 👋
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 border border-primary text-primary px-4 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 p-4 border transition-all ${
                  activeTab === tab.id
                    ? "bg-foreground/8 border-foreground text-foreground"
                    : "border-border hover:border-foreground/30 text-muted-foreground"
                }`}
              >
                {tab.icon}
                <span className="text-2xl font-black">{tab.count ?? 0}</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loyalty Stamp Card */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8">
        <LoyaltyStampCard orderCount={orders?.length ?? 0} />
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs uppercase tracking-widest font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {(tab.count ?? 0) > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* ── Orders Tab ── */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl font-black">Your Orders</h2>
              <Link to="/shop" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary font-semibold hover:underline">
                <ShoppingBag className="h-3.5 w-3.5" /> Shop more
              </Link>
            </div>
            {!orders?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-card">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your order history will appear here.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-lg hover:opacity-90 transition-opacity">
                  Start Shopping <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map((o: any) => {
                  const firstItem = o.order_items?.[0];
                  const productImage = firstItem?.image_snapshot;
                  const productSlug = firstItem?.product_slug;
                  const productTitle = firstItem?.title_snapshot;
                  const itemCount = o.order_items?.length ?? 0;

                  const content = (
                    <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-muted">
                          {productImage ? (
                            <img src={productImage} alt={productTitle ?? "Product"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          {productTitle && (
                            <p className="text-sm font-semibold leading-snug line-clamp-1">{productTitle}</p>
                          )}
                          <p className="text-xs font-bold tracking-wide text-muted-foreground">
                            #{o.id.slice(0, 8).toUpperCase()}
                            {itemCount > 1 && <span className="ml-1.5 text-foreground/60">+{itemCount - 1} more</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                            {new Date(o.created_at).toLocaleDateString()} · {o.fulfillment_status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold">{formatPrice(o.total_cents)}</p>
                        <span className={`inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          o.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {o.payment_status}
                        </span>
                      </div>
                    </div>
                  );

                  return productSlug ? (
                    <li key={o.id}>
                      <Link to="/product/$slug" params={{ slug: productSlug }}>
                        {content}
                      </Link>
                    </li>
                  ) : (
                    <li key={o.id}>{content}</li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ── Wishlist Tab ── */}
        {activeTab === "wishlist" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl font-black">Your Wishlist</h2>
              <Link to="/shop" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary font-semibold hover:underline">
                Browse more
              </Link>
            </div>
            {!wishlist?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-card">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold">Your wishlist is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Save items you love — find them here later.</p>
                <Link to="/shop" className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-lg hover:opacity-90 transition-opacity">
                  Explore Products <ChevronRight className="h-4 w-4" />
                </Link>
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
          </div>
        )}

        {/* ── Saved Designs Tab ── */}
        {activeTab === "designs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl font-black">Saved Designs</h2>
              <Link to="/create" className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary font-semibold hover:underline">
                <Sparkles className="h-3.5 w-3.5" /> New design
              </Link>
            </div>
            {!designs?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-card">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold">No saved designs</p>
                <p className="text-sm text-muted-foreground mt-1">Create a custom tee and save your design here.</p>
                <Link to="/create" className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-bold rounded-lg hover:opacity-90 transition-opacity">
                  Create a Design <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {designs.map((d) => (
                  <div key={d.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
                    <div className="relative h-48 bg-muted overflow-hidden">
                      <DesignImage path={d.design_file_url} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider">Custom Tee</h3>
                      <p className="text-xs text-muted-foreground mt-1">Color: <span className="font-semibold capitalize">{d.base_color}</span></p>
                      <p className="text-xs text-muted-foreground">Created: {new Date(d.created_at).toLocaleDateString()}</p>
                      <button
                        onClick={async () => {
                          try {
                            const { data: signed, error } = await supabase.storage
                              .from("user-graphics")
                              .createSignedUrl(d.design_file_url, 60 * 60 * 24 * 7);
                            if (error) throw error;
                            addItem({
                              custom_design_id: d.id,
                              title: `Custom Tee · ${d.base_color}`,
                              image: signed.signedUrl,
                              size: "L",
                              unit_price_cents: 209900,
                            });
                            toast.success("Added custom tee to bag");
                          } catch {
                            toast.error("Failed to re-add design to bag");
                          }
                        }}
                        className="mt-3 w-full bg-primary text-primary-foreground py-2 text-xs uppercase tracking-widest font-bold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Re-add to Bag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
