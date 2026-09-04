import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listPromoCodes,
  createPromoCode,
  togglePromoCodeStatus,
  deletePromoCode,
} from "@/lib/admin.functions";

export default function PromoCodeSection() {
  const qc = useQueryClient();
  const createFn = useServerFn(createPromoCode);
  const toggleFn = useServerFn(togglePromoCodeStatus);
  const deleteFn = useServerFn(deletePromoCode);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => listPromoCodes(),
  });

  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "15",
    minOrderValue: "999",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderValue: Number(form.minOrderValue),
        },
      }),
    onSuccess: () => {
      toast.success(`Promo code "${form.code.toUpperCase()}" added`);
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      setForm({ code: "", discountType: "percent", discountValue: "15", minOrderValue: "999" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create promo code"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Promo code deleted");
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
    },
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Promo Code Management</h2>
        <p className="text-sm text-muted-foreground">Manually specify custom promo codes, discount percentages, and minimum cart thresholds</p>
      </div>

      {/* Create Promo Code Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="border border-border bg-card p-5 grid sm:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Promo Code String *</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. WEEKDAYZZ20"
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono font-bold uppercase tracking-wider"
            required
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Discount Type</label>
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm uppercase tracking-wider"
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Flat (₹)</option>
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {form.discountType === "percent" ? "Discount Percentage (%)" : "Flat Discount (₹)"}
          </label>
          <input
            type="number"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
            required
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Min Order Value (₹)</label>
          <input
            type="number"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="sm:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-accent text-accent-foreground px-6 py-2.5 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding Promo…" : "+ Add Custom Promo Code"}
          </button>
        </div>
      </form>

      {/* Active Promos List */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Min Cart</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading promo codes…
                </td>
              </tr>
            ) : (promoCodes ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No promo codes created yet.
                </td>
              </tr>
            ) : (
              (promoCodes ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-accent text-sm">{p.code}</td>
                  <td className="px-4 py-3 font-semibold">
                    {p.discountType === "percent" ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT OFF`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">₹{p.minOrderValue}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(p.id)}
                      className={`text-xs uppercase tracking-widest font-bold px-2.5 py-1 border transition-colors ${
                        p.isActive
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {p.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="p-1.5 hover:bg-destructive/20 border border-destructive/40 text-destructive text-xs uppercase tracking-widest"
                      title="Delete promo code"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
