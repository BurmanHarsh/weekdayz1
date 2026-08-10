import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart, cartSubtotal } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { getFallbackProducts } from "@/lib/fallback-data";

export function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, removeItem, updateQty, syncItemPrices } = useCart();
  const navigate = useNavigate();
  const subtotal = cartSubtotal(items);

  useEffect(() => {
    if (drawerOpen) {
      const products = getFallbackProducts();
      syncItemPrices(products);
    }
  }, [drawerOpen, syncItemPrices]);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-display text-xl tracking-tight">YOUR BAG</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="p-2 hover:text-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground mb-6">Your bag is empty.</p>
                  <Link
                    to="/shop"
                    onClick={() => setDrawerOpen(false)}
                    className="inline-block bg-accent text-accent-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90"
                  >
                    Browse the drops
                  </Link>
                </div>
              ) : (
                <ul className="space-y-5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4">
                      <div className="w-20 h-24 bg-muted overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                          <button onClick={() => removeItem(item.key)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                          Size {item.size} {item.color ? `• ${item.color}` : ""}
                          {item.custom_design_id && <span className="ml-2 text-accent">Custom Print</span>}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border">
                            <button onClick={() => updateQty(item.key, item.quantity - 1)} className="p-1.5 hover:bg-secondary">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-sm">{item.quantity}</span>
                            <button onClick={() => updateQty(item.key, item.quantity + 1)} className="p-1.5 hover:bg-secondary">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold">{formatPrice(item.unit_price_cents * item.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-border space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping calculated at checkout.</p>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate({ to: "/checkout" });
                  }}
                  className="w-full bg-accent text-accent-foreground py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
