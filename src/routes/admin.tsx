import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, Package, Sparkles, Plus, X, Download } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  getAdminStats,
  listAllOrders,
  updateOrderStatus,
  createProduct,
  getSignedAdminDesignUrl,
} from "@/lib/admin.functions";
import { generateTrackingId } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";

type Order = Awaited<ReturnType<typeof listAllOrders>>[number];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Weekdayz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (!user || !isAdmin) {
    return <div className="py-24 text-center text-muted-foreground text-sm">Checking access…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <span className="text-xs uppercase tracking-[0.3em] text-accent">Admin</span>
      <h1 className="text-display text-5xl mt-2 mb-10">Control Room</h1>

      <Stats />
      <ProductCreator />
      <OrdersQueue />
    </div>
  );
}

function Stats() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => getAdminStats() });
  const cards = [
    { label: "Revenue", value: data ? formatPrice(data.total_revenue_cents) : "—", icon: IndianRupee },
    { label: "Pending Orders", value: data?.pending_standard_orders ?? "—", icon: Package },
    { label: "Custom Prints", value: data?.pending_custom_orders ?? "—", icon: Sparkles },
  ];
  return (
    <div className="grid sm:grid-cols-3 gap-4 mb-12">
      {cards.map((c) => (
        <div key={c.label} className="border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
            <c.icon className="h-4 w-4 text-accent" />
          </div>
          <p className="text-3xl font-semibold mt-3">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductCreator() {
  const qc = useQueryClient();
  const createFn = useServerFn(createProduct);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    price: "1899",
    inventory: "100",
    category: "tee",
    image_urls: "",
    sizes: "S,M,L,XL,XXL",
  });
  const m = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          title: form.title,
          description: form.description,
          price_cents: Math.round(Number(form.price) * 100),
          inventory_count: Number(form.inventory),
          image_urls: form.image_urls.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
          sizes: form.sizes.split(",").map((s) => s.trim()),
          colors: [],
          category: form.category,
        },
      }),
    onSuccess: () => {
      toast.success("Product added");
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({ ...form, slug: "", title: "", description: "", image_urls: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">New product</h2>
        <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-accent">
          <Plus className="h-3 w-3" /> {open ? "Close" : "Add product"}
        </button>
      </div>
      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="border border-border bg-card p-5 grid sm:grid-cols-2 gap-3"
        >
          {[
            ["title", "Title"],
            ["slug", "Slug (optional)"],
            ["price", "Price (₹)"],
            ["inventory", "Inventory"],
            ["category", "Category"],
            ["sizes", "Sizes (comma)"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
              <input
                value={(form as Record<string, string>)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Image URLs (comma or newline separated)</label>
            <textarea
              value={form.image_urls}
              onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
              rows={2}
              placeholder="/products/tee-black.jpg, /products/tee-white.jpg"
              className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              TODO: Hook up multi-image uploader to the <code>product-images</code> bucket (see README).
            </p>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={m.isPending}
              className="bg-accent text-accent-foreground px-5 py-3 text-sm uppercase tracking-widest font-semibold disabled:opacity-50"
            >
              {m.isPending ? "Saving…" : "Create product"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function OrdersQueue() {
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listAllOrders() });
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Order queue</h2>
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Fulfillment</th>
              <th className="text-left px-4 py-3">Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3">{formatPrice(o.total_cents)}</td>
                <td className="px-4 py-3"><Badge label={o.payment_status} /></td>
                <td className="px-4 py-3"><Badge label={o.fulfillment_status} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(o)} className="text-accent text-xs uppercase tracking-widest hover:underline">Open</button>
                </td>
              </tr>
            ))}
            {!orders?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block border border-border px-2 py-0.5 text-xs uppercase tracking-widest">{label}</span>
  );
}

const STATUSES = ["processing", "printed", "shipped", "delivered", "cancelled"] as const;
type Status = typeof STATUSES[number];

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateOrderStatus);
  const signFn = useServerFn(getSignedAdminDesignUrl);
  const [status, setStatus] = useState<Status>(order.fulfillment_status as Status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [signed, setSigned] = useState<Record<string, string>>({});

  useEffect(() => {
    order.order_items?.forEach((it) => {
      const path = it.custom_designs?.design_file_url;
      if (!path || signed[path]) return;
      signFn({ data: { path } }).then((r) => setSigned((m) => ({ ...m, [path]: r.url }))).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const m = useMutation({
    mutationFn: () => updateFn({ data: { id: order.id, fulfillment_status: status, tracking_number: tracking || undefined } }),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const shipping = (order.shipping_details as Record<string, string>) ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
            <p className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Shipping</h3>
            <div className="text-sm">
              <p>{shipping.full_name} · {shipping.phone}</p>
              <p>{shipping.line1} {shipping.line2}</p>
              <p>{shipping.city}, {shipping.state} {shipping.postal_code}, {shipping.country}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Items</h3>
            <ul className="divide-y divide-border border border-border">
              {order.order_items?.map((it) => {
                const path = it.custom_designs?.design_file_url;
                const url = path ? signed[path] : null;
                const placement = it.custom_designs?.placement_settings as Record<string, number> | null;
                return (
                  <li key={it.id} className="p-3 flex gap-3 items-start">
                    <div className="w-14 h-16 bg-muted overflow-hidden flex-shrink-0">
                      {it.image_snapshot && <img src={it.image_snapshot} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold">{it.title_snapshot || "Item"}</p>
                      <p className="text-xs text-muted-foreground">Size {it.size} · Qty {it.quantity} · {formatPrice(it.unit_price_cents)}</p>
                      {it.custom_designs && (
                        <div className="mt-2 border border-accent/40 bg-accent/5 p-2 text-xs space-y-1">
                          <p className="text-accent uppercase tracking-widest">Custom print</p>
                          <p>Base color: <span className="font-mono">{it.custom_designs.base_color}</span></p>
                          {placement && (
                            <p>Placement: scale {placement.scale?.toFixed?.(2)}, rotate {placement.rotate}°, x {Math.round(placement.x ?? 0)}, y {Math.round(placement.y ?? 0)}</p>
                          )}
                          {url ? (
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline">
                              <Download className="h-3 w-3" /> High-res file
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Signing URL…</span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Tracking number</label>
              <div className="mt-1 flex gap-2">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="flex-1 bg-background border border-border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setTracking(generateTrackingId())} className="text-xs uppercase tracking-widest border border-border px-3">Gen</button>
              </div>
            </div>
          </section>

          <button
            onClick={() => m.mutate()}
            disabled={m.isPending}
            className="w-full bg-accent text-accent-foreground py-3 text-sm uppercase tracking-widest font-semibold disabled:opacity-50"
          >
            {m.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
