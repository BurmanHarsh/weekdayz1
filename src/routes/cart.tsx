import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Weekdayzz" },
      { name: "description", content: "Review your bag before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, removeItem, updateQty } = useCart();
  const subtotal = cartSubtotal(items);

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <ShoppingBag className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-display text-4xl">Your bag is empty.</h1>
        <Link to="/shop" className="inline-block mt-8 bg-accent text-accent-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold">
          Shop the drops
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-display text-5xl mb-10">YOUR BAG</h1>
      <div className="grid lg:grid-cols-[1fr_320px] gap-12">
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.key} className="py-5 flex gap-4">
              <div className="w-24 h-28 bg-muted overflow-hidden flex-shrink-0">
                <img src={i.image} alt={i.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold">{i.title}</h3>
                  <div className="flex items-center gap-2">
                    {i.custom_design_id && (
                      <Link
                        to="/create"
                        search={{ designId: i.custom_design_id, cartKey: i.key }}
                        className="text-xs text-accent font-bold hover:underline"
                      >
                        Edit Design
                      </Link>
                    )}
                    <button onClick={() => removeItem(i.key)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Size {i.size}{i.custom_design_id && <span className="ml-2 text-accent">Custom</span>}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-border">
                    <button onClick={() => updateQty(i.key, i.quantity - 1)} className="p-1.5 hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                    <span className="px-3 text-sm">{i.quantity}</span>
                    <button onClick={() => updateQty(i.key, i.quantity + 1)} className="p-1.5 hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="font-semibold">{formatPrice(i.unit_price_cents * i.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="bg-card border border-border p-6 h-fit lg:sticky lg:top-24">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Summary</h2>
          <div className="flex justify-between mb-2"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <p className="text-xs text-muted-foreground mb-6">Shipping calculated at checkout.</p>
          <Link to="/checkout" className="block w-full text-center bg-accent text-accent-foreground py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90">
            Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
