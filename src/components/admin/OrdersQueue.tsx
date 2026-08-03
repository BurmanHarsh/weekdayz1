import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { X, Download, FileText } from "lucide-react";
import { toast } from "sonner";

import {
  listAllOrders,
  updateOrderStatus,
  getSignedAdminDesignUrl,
} from "@/lib/admin.functions";
import { generateTrackingId } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import { exportOrderToPdf } from "@/lib/OrderPdfExporter";
import { Order, Badge, STATUSES, Status } from "./shared";

export default function OrdersQueue() {
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listAllOrders() });
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Fulfillment & Orders Queue</h2>
          <p className="text-sm text-muted-foreground">Manage customer shipments, custom print designs, and export PDF manifests</p>
        </div>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
            <tr>
              <th className="text-left px-4 py-3">Order ID</th>
              <th className="text-left px-4 py-3">Total Amount</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Fulfillment</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(o.total_cents)}</td>
                <td className="px-4 py-3"><Badge label={o.payment_status} /></td>
                <td className="px-4 py-3"><Badge label={o.fulfillment_status} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => exportOrderToPdf(o)}
                      className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs uppercase tracking-widest hover:bg-secondary font-semibold"
                      title="Export Order PDF"
                    >
                      <FileText className="h-3.5 w-3.5 text-accent" /> PDF Export
                    </button>
                    <button
                      onClick={() => setSelected(o)}
                      className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-2.5 py-1 text-xs uppercase tracking-widest font-bold"
                    >
                      Manage
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders?.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">No customer orders placed yet.</td></tr>
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
      signFn({ data: { path } })
        .then((r) => setSigned((m) => ({ ...m, [path]: r.url })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const m = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: order.id,
          fulfillment_status: status,
          tracking_number: tracking || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update order"),
  });

  const shipping = (order.shipping_details as Record<string, string>) ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Order Details</p>
            <p className="font-mono text-lg font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportOrderToPdf(order)}
              className="inline-flex items-center gap-1 border border-border px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-secondary font-semibold"
            >
              <FileText className="h-3.5 w-3.5 text-accent" /> PDF Export
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section className="border border-border p-4 bg-background/40">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Shipping Information</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{shipping.full_name || "Customer"} · {shipping.phone || "No phone"}</p>
              <p>{shipping.line1} {shipping.line2}</p>
              <p>{shipping.city}, {shipping.state} {shipping.postal_code}, {shipping.country}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Order Items</h3>
            <ul className="divide-y divide-border border border-border">
              {order.order_items?.map((it) => {
                const path = it.custom_designs?.design_file_url;
                const url = path ? signed[path] : null;
                const placement = it.custom_designs?.placement_settings as Record<string, number> | null;
                return (
                  <li key={it.id} className="p-3 flex gap-3 items-start">
                    <div className="w-14 h-16 bg-muted overflow-hidden flex-shrink-0 border border-border">
                      {it.image_snapshot && <img src={it.image_snapshot} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold">{it.title_snapshot || "Item"}</p>
                      <p className="text-xs text-muted-foreground">
                        Size {it.size}{(it as any).color ? ` · ${(it as any).color}` : ""} · Qty {it.quantity} · {formatPrice(it.unit_price_cents)}
                      </p>
                      {it.custom_designs && (
                        <div className="mt-2 border border-accent/40 bg-accent/5 p-2 text-xs space-y-1">
                          <p className="text-accent uppercase tracking-widest font-bold">Custom Print Asset</p>
                          <p>Base Color: <span className="font-mono">{it.custom_designs.base_color}</span></p>
                          {placement && (
                            <p>
                              Placement: scale {placement.scale?.toFixed?.(2)}, rotate {placement.rotate}°, x {Math.round(placement.x ?? 0)}, y {Math.round(placement.y ?? 0)}
                            </p>
                          )}
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-accent font-semibold underline mt-1"
                            >
                              <Download className="h-3.5 w-3.5" /> Download High-Res Graphic
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">Generating high-res download link…</span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="grid sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Update Order Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm uppercase tracking-wider font-semibold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Shiprocket Tracking Number</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Enter tracking ID…"
                  className="flex-1 bg-background border border-border px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setTracking(generateTrackingId())}
                  className="text-xs uppercase tracking-widest border border-border px-3 font-semibold hover:bg-secondary"
                >
                  Generate
                </button>
              </div>
            </div>
          </section>

          <button
            onClick={() => m.mutate()}
            disabled={m.isPending}
            className="w-full bg-accent text-accent-foreground py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50 shadow"
          >
            {m.isPending ? "Saving Order Status…" : "Save Order Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
