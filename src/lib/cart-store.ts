import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  key: string; // unique per (product+size) or (design+size)
  product_id?: string;
  custom_design_id?: string;
  title: string;
  image: string;
  size: string;
  unit_price_cents: number;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity" | "key"> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  setDrawerOpen: (open: boolean) => void;
}

function makeKey(item: Omit<CartItem, "quantity" | "key">) {
  return [item.product_id ?? "p", item.custom_design_id ?? "d", item.size].join("|");
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      addItem: (item) =>
        set((state) => {
          const key = makeKey(item);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i,
              ),
              drawerOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, key, quantity: item.quantity ?? 1 }],
            drawerOpen: true,
          };
        }),
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      updateQty: (key, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "weekdayz-cart" },
  ),
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);
}
