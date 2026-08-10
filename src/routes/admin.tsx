import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  IndianRupee,
  Package,
  Sparkles,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Percent,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";
import {
  getAdminStats,
  listAdminProducts,
  bootstrapAdmin,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { TabSkeleton } from "@/components/admin/shared";

/* ─── Lazy-loaded tab sections (code-split) ─── */
const ProductCatalogSection = lazy(() => import("@/components/admin/ProductCatalogSection"));
const OrdersQueue = lazy(() => import("@/components/admin/OrdersQueue"));
const PromoCodeSection = lazy(() => import("@/components/admin/PromoCodeSection"));
const ProfitAnalyticsSection = lazy(() => import("@/components/admin/ProfitAnalyticsSection"));

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Room — Weekdayz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "promos" | "analytics">("analytics");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const bootstrapFn = useServerFn(bootstrapAdmin);

  if (loading) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Checking access credentials…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md my-24 border border-border bg-card p-8 text-center space-y-4 shadow-xl">
        <h2 className="text-xl font-bold">Admin Login Required</h2>
        <p className="text-xs text-muted-foreground">Please sign in to access the Weekdayz Control Room.</p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md my-20 border border-border bg-card p-8 text-center space-y-4 shadow-xl">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Admin Activation Required</h2>
        <p className="text-xs text-muted-foreground">
          Logged in as <span className="font-semibold text-foreground">{user.email}</span>. Click below to grant Admin Control Room access to your account.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await bootstrapFn({ data: { secret: bootstrapSecret } });
              toast.success("Account promoted to Admin!");
              window.location.reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to promote account");
            }
          }}
          className="space-y-3 pt-2"
        >
          <input
            type="password"
            value={bootstrapSecret}
            onChange={(e) => setBootstrapSecret(e.target.value)}
            placeholder="Bootstrap Secret"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-center font-mono"
          />
          <button
            type="submit"
            className="w-full bg-accent text-accent-foreground py-2.5 text-xs uppercase tracking-widest font-bold"
          >
            ⚡ Activate Admin Access
          </button>
        </form>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Admin Panel</span>
            <h1 className="text-display text-4xl sm:text-5xl mt-1">Control Room</h1>
          </div>
          <button
            onClick={signOut}
            className="sm:hidden inline-flex items-center gap-2 border border-border px-3 py-1.5 text-xs uppercase tracking-widest font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <LogOut className="h-3 w-3" /> Out
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={signOut}
            className="hidden sm:inline-flex items-center gap-2 border border-border px-4 py-2.5 text-xs uppercase tracking-widest font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-1">
          {[
            { id: "analytics", label: "📈 Profit Analytics" },
            { id: "catalog", label: "Catalog & Products" },
            { id: "orders", label: "Orders & Shipping" },
            { id: "promos", label: "Promo Codes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Stats />

      <Suspense fallback={<TabSkeleton />}>
        {activeTab === "analytics" && <ProfitAnalyticsSection />}
        {activeTab === "catalog" && <ProductCatalogSection />}
        {activeTab === "orders" && <OrdersQueue />}
        {activeTab === "promos" && <PromoCodeSection />}
      </Suspense>
    </div>
  );
}

function Stats() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() });
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: () => listAdminProducts() });

  const lowStockCount = (products ?? []).filter((p) => (p.inventory_count ?? 0) < 10).length;

  const cards = [
    { label: "Total Revenue", value: data ? formatPrice(data.total_revenue_cents) : "—", icon: IndianRupee },
    { label: "Pending Orders", value: data?.pending_standard_orders ?? "—", icon: Package },
    { label: "Custom Print Orders", value: data?.pending_custom_orders ?? "—", icon: Sparkles },
    { label: "Low Stock Alert (<10)", value: lowStockCount, icon: AlertTriangle, warning: lowStockCount > 0 },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`border p-5 bg-card transition-all ${
            c.warning ? "border-amber-500/50 bg-amber-500/5" : "border-border"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.warning ? "text-amber-500" : "text-accent"}`} />
          </div>
          <p className="text-3xl font-semibold mt-3">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
