import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCart, cartSubtotal } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";
import { calculateShippingCost } from "@/lib/shipping";
import { placeOrder } from "@/lib/orders.functions";

const ShippingSchema = z.object({
  full_name: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Required"),
  line1: z.string().min(2, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  postal_code: z.string().min(3, "Required"),
  country: z.string().min(2, "Required"),
});
type Shipping = z.infer<typeof ShippingSchema>;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Weekdayz" },
      { name: "description", content: "Secure checkout. Free shipping above ₹2,000." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = cartSubtotal(items);
  const shippingCost = shipping ? calculateShippingCost(shipping) : 9900;
  const freeShip = subtotal >= 200000;
  const total = subtotal + (freeShip ? 0 : shippingCost);

  const form = useForm<Shipping>({
    resolver: zodResolver(ShippingSchema),
    defaultValues: { country: "IN", email: user?.email ?? "" },
  });

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-display text-4xl">Nothing to check out.</h1>
        <Link to="/shop" className="inline-block mt-6 bg-accent text-accent-foreground px-6 py-3 text-sm uppercase tracking-widest font-semibold">Shop</Link>
      </div>
    );
  }

  async function pay() {
    if (!user) {
      toast.error("Sign in to complete your order");
      navigate({ to: "/auth" });
      return;
    }
    if (!shipping) return;
    setLoading(true);
    // MOCK PAYMENT: simulate a successful payment intent. Real integration:
    // create intent → confirm → on webhook success, hit placeOrder server fn.
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const { id } = await placeOrderFn({
        data: {
          items: items.map((i) => ({
            product_id: i.product_id ?? null,
            custom_design_id: i.custom_design_id ?? null,
            quantity: i.quantity,
            size: i.size,
            unit_price_cents: i.unit_price_cents,
            title_snapshot: i.title,
            image_snapshot: i.image,
          })),
          total_cents: total,
          shipping_details: shipping,
          payment_intent_id: `mock_${crypto.randomUUID()}`,
        },
      });
      clear();
      toast.success("Payment successful!");
      navigate({ to: "/account", search: { order: id } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="text-display text-5xl mb-2">CHECKOUT</h1>

      <div className="flex items-center gap-3 mb-10 text-xs uppercase tracking-widest">
        {(["Shipping", "Review", "Payment"] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className={`flex items-center gap-2 ${active ? "text-accent" : done ? "text-foreground" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 grid place-items-center border ${active ? "border-accent bg-accent text-accent-foreground" : done ? "border-foreground bg-foreground text-background" : "border-border"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              {label}
              {n < 3 && <span className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {step === 1 && (
            <form
              onSubmit={form.handleSubmit((d) => { setShipping(d); setStep(2); })}
              className="space-y-4"
            >
              {(
                [
                  ["full_name", "Full name"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["line1", "Address line 1"],
                  ["line2", "Address line 2 (optional)"],
                  ["city", "City"],
                  ["state", "State / Region"],
                  ["postal_code", "Postal code"],
                  ["country", "Country (e.g. IN)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
                  <input
                    {...form.register(key)}
                    className="mt-1 w-full bg-card border border-border px-3 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                  {form.formState.errors[key] && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors[key]?.message as string}</p>
                  )}
                </div>
              ))}
              <button type="submit" className="bg-accent text-accent-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold">
                Continue to review
              </button>
            </form>
          )}

          {step === 2 && shipping && (
            <div className="space-y-6">
              <div className="bg-card border border-border p-5 text-sm">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Shipping to</h3>
                <p>{shipping.full_name}</p>
                <p>{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}</p>
                <p>{shipping.city}, {shipping.state} {shipping.postal_code}</p>
                <p>{shipping.country}</p>
                <button onClick={() => setStep(1)} className="text-xs text-accent uppercase tracking-widest mt-3 hover:underline">Edit</button>
              </div>
              <ul className="divide-y divide-border border border-border">
                {items.map((i) => (
                  <li key={i.key} className="p-4 flex gap-3 items-center">
                    <div className="w-12 h-14 bg-muted overflow-hidden"><img src={i.image} alt="" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold">{i.title}</p>
                      <p className="text-xs text-muted-foreground">Size {i.size} · Qty {i.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(i.unit_price_cents * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setStep(3)} className="bg-accent text-accent-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold">
                Continue to payment
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-card border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-4 w-4 text-accent" />
                  <h3 className="text-xs uppercase tracking-widest">Mock payment</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a demo. No real card is charged. Replace with Stripe/Razorpay for production.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input placeholder="Card number" className="bg-background border border-border px-3 py-3 text-sm" defaultValue="4242 4242 4242 4242" />
                  <input placeholder="MM/YY" className="bg-background border border-border px-3 py-3 text-sm" defaultValue="12/30" />
                  <input placeholder="Name on card" className="bg-background border border-border px-3 py-3 text-sm" defaultValue={shipping?.full_name ?? ""} />
                  <input placeholder="CVV" className="bg-background border border-border px-3 py-3 text-sm" defaultValue="123" />
                </div>
              </div>
              <button
                onClick={pay}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-5 text-sm uppercase tracking-widest font-semibold disabled:opacity-50 hover:bg-accent/90"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <>Pay {formatPrice(total)}</>}
              </button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  <Link to="/auth" className="text-accent underline">Sign in</Link> to complete your order.
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="bg-card border border-border p-6 h-fit lg:sticky lg:top-24 space-y-3 text-sm">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Order summary</h3>
          <div className="flex justify-between"><span>Items</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{freeShip ? <span className="text-accent">FREE</span> : formatPrice(shippingCost)}</span></div>
          <div className="border-t border-border pt-3 flex justify-between text-base font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
        </aside>
      </div>
    </div>
  );
}
