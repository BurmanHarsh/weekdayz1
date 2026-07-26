import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  listAllOrders,
  listAdminProducts,
} from "@/lib/admin.functions";

/* ─── Derived Types ─── */
export type Order = Awaited<ReturnType<typeof listAllOrders>>[number];
export type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

export const STATUSES = ["processing", "printed", "shipped", "delivered", "cancelled"] as const;
export type Status = typeof STATUSES[number];

/* ─── Badge ─── */
export function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block border border-border px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-secondary/30">
      {label}
    </span>
  );
}

/* ─── Category Dropdown ─── */
export function CategoryDropdown({
  value,
  onChange,
  allCategories,
  presetCategories,
}: {
  value: string;
  onChange: (val: string) => void;
  allCategories: string[];
  presetCategories: string[];
}) {
  const [open, setOpen] = useState(false);

  const getLabel = (val: string) => {
    if (val === "other") return "+ Type Custom Category…";
    return val.toUpperCase();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm font-semibold uppercase tracking-wider text-left flex items-center justify-between"
      >
        <span>{getLabel(value)}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border max-h-48 overflow-y-auto shadow-2xl divide-y divide-border/50">
          {presetCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-xs uppercase font-semibold tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors ${
                value === c ? "bg-accent/10 text-accent font-bold" : "text-foreground"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}

          {allCategories
            .filter((c) => !presetCategories.includes(c))
            .map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs uppercase font-semibold tracking-wider hover:bg-accent hover:text-accent-foreground transition-colors ${
                  value === c ? "bg-accent/10 text-accent font-bold" : "text-foreground"
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}

          <button
            type="button"
            onClick={() => {
              onChange("other");
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 text-xs uppercase font-bold tracking-wider text-accent hover:bg-accent hover:text-accent-foreground transition-colors ${
              value === "other" ? "bg-accent/20 font-bold" : ""
            }`}
          >
            + Type Custom Category…
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Loading Skeleton for lazy tab content ─── */
export function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-64 bg-secondary/40 rounded" />
      <div className="border border-border bg-card p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-secondary/30 rounded" />
        ))}
      </div>
    </div>
  );
}
