import React from "react";
import { ShieldAlert, CreditCard, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StorePoliciesNoticeProps {
  className?: string;
  variant?: "table" | "compact" | "card";
}

export const STORE_POLICIES = [
  {
    category: "Payment Method",
    icon: CreditCard,
    standard: "100% Prepaid only (No COD)",
    custom: "100% Prepaid only",
    highlight: true,
  },
  {
    category: "Return Policy",
    icon: ShieldAlert,
    standard: "No Returns accepted",
    custom: "No Returns accepted",
    highlight: false,
  },
  {
    category: "Exchange Window",
    icon: Clock,
    standard: "Within 4 days after delivery",
    custom: "Within 2 days after delivery",
    highlight: true,
  },
  {
    category: "Exchange Conditions",
    icon: RotateCcw,
    standard: "standard size/color exchange",
    custom: "Valid only if wrong size or incorrect print/design was delivered",
    highlight: false,
  },
];

export function StorePoliciesNotice({ className, variant = "table" }: StorePoliciesNoticeProps) {
  if (variant === "compact") {
    return (
      <div className={cn("border border-border/80 bg-muted/30 p-3 text-xs space-y-1.5 rounded-lg", className)}>
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-accent" />
          <span>Store &amp; Exchange Policy</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          <strong>100% Prepaid Only</strong> (No COD) • <strong>Standard:</strong> 4-day exchange (size/color) • <strong>Custom:</strong> 2-day exchange (wrong size/print only) • <em>No returns accepted.</em>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border border-border bg-card overflow-hidden rounded-xl shadow-sm", className)}>
      <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Official Store Policies
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-background px-2 py-0.5 border border-border rounded">
          Prepaid Only
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4 font-bold">Policy Category</th>
              <th className="py-2.5 px-4 font-bold">Standard Orders</th>
              <th className="py-2.5 px-4 font-bold">Custom Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STORE_POLICIES.map((p) => {
              const Icon = p.icon;
              return (
                <tr key={p.category} className="hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{p.category}</span>
                  </td>
                  <td className="py-3 px-4 text-foreground/90 font-medium">
                    {p.standard === "100% Prepaid only (No COD)" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-accent/15 text-accent font-bold text-[11px]">
                        {p.standard}
                      </span>
                    ) : p.standard === "No Returns accepted" ? (
                      <span className="text-destructive font-semibold">{p.standard}</span>
                    ) : (
                      p.standard
                    )}
                  </td>
                  <td className="py-3 px-4 text-foreground/90 font-medium">
                    {p.custom === "100% Prepaid only" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-accent/15 text-accent font-bold text-[11px]">
                        {p.custom}
                      </span>
                    ) : p.custom === "No Returns accepted" ? (
                      <span className="text-destructive font-semibold">{p.custom}</span>
                    ) : (
                      <span className={p.category === "Exchange Conditions" ? "text-muted-foreground" : ""}>
                        {p.custom}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
