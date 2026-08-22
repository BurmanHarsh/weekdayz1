import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SizeChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGarment?: string;
}

const SIZE_TABLES: Record<string, { size: string; chest: string; length: string; shoulder: string }[]> = {
  "Oversized Tees": [
    { size: "XS", chest: '38"', length: '27"', shoulder: '18.5"' },
    { size: "S", chest: '40"', length: '28"', shoulder: '19.5"' },
    { size: "M", chest: '42"', length: '29"', shoulder: '20.5"' },
    { size: "L", chest: '44"', length: '30"', shoulder: '21.5"' },
    { size: "XL", chest: '46"', length: '31"', shoulder: '22.5"' },
    { size: "XXL", chest: '48"', length: '32"', shoulder: '23.5"' },
    { size: "XXXL", chest: '50"', length: '33"', shoulder: '24.5"' },
  ],
  "Regular Fit": [
    { size: "XS", chest: '36"', length: '26"', shoulder: '17.5"' },
    { size: "S", chest: '38"', length: '27"', shoulder: '18"' },
    { size: "M", chest: '40"', length: '28"', shoulder: '18.5"' },
    { size: "L", chest: '42"', length: '29"', shoulder: '19.5"' },
    { size: "XL", chest: '44"', length: '30"', shoulder: '20.5"' },
    { size: "XXL", chest: '46"', length: '31"', shoulder: '21.5"' },
  ],
  Hoodies: [
    { size: "S", chest: '42"', length: '27.5"', shoulder: '20"' },
    { size: "M", chest: '44"', length: '28.5"', shoulder: '21"' },
    { size: "L", chest: '46"', length: '29.5"', shoulder: '22"' },
    { size: "XL", chest: '48"', length: '30.5"', shoulder: '23"' },
    { size: "XXL", chest: '50"', length: '31.5"', shoulder: '24"' },
  ],
};

export function SizeChartModal({ open, onOpenChange, defaultGarment = "Oversized Tees" }: SizeChartModalProps) {
  const [activeGarment, setActiveGarment] = useState(
    SIZE_TABLES[defaultGarment] ? defaultGarment : "Oversized Tees",
  );

  const tableData = SIZE_TABLES[activeGarment] || SIZE_TABLES["Oversized Tees"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border border-border p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-foreground">
            Garment Size Guide
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            All measurements are in inches. Standard relaxed fit.
          </p>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-border pb-3 mt-2 overflow-x-auto">
          {Object.keys(SIZE_TABLES).map((garment) => (
            <button
              key={garment}
              onClick={() => setActiveGarment(garment)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                activeGarment === garment
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {garment}
            </button>
          ))}
        </div>

        {/* Size Chart Image Preview */}
        <div className="my-3 border border-border rounded-none bg-card p-3 flex justify-center items-center">
          <img
            src="/products/size-chart-oversized.png"
            alt="Size Measurement Diagram"
            className="max-h-48 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Measurement Table */}
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary uppercase text-[10px] tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="p-2.5 font-bold">Size</th>
                <th className="p-2.5 font-bold">Chest (Inches)</th>
                <th className="p-2.5 font-bold">Length (Inches)</th>
                <th className="p-2.5 font-bold">Shoulder (Inches)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {tableData.map((row) => (
                <tr key={row.size} className="hover:bg-secondary/40">
                  <td className="p-2.5 font-black">{row.size}</td>
                  <td className="p-2.5 text-muted-foreground">{row.chest}</td>
                  <td className="p-2.5 text-muted-foreground">{row.length}</td>
                  <td className="p-2.5 text-muted-foreground">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-secondary/50 p-3 border border-border text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">Tip: </span> For an extra oversized streetwear drop fit, size up one size. If between sizes, choose the smaller size for a cleaner relaxed look.
        </div>
      </DialogContent>
    </Dialog>
  );
}
