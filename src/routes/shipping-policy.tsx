import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — Weekdayz" },
      { name: "description", content: "Shipping timelines, logistics partners and delivery details." },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-display text-4xl sm:text-5xl font-black mb-6">SHIPPING POLICY</h1>
      <p className="text-sm text-muted-foreground mb-8">Fast pan-India delivery</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">1. Shipping Charges</h2>
          <p>
            • <strong className="text-foreground">Free Shipping:</strong> On all orders of ₹2,000 or above.<br />
            • <strong className="text-foreground">Standard Delivery:</strong> Flat ₹99 for orders under ₹2,000.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">2. Processing & Delivery Timelines</h2>
          <p>
            • Standard catalog drops ship within 24–48 hours.<br />
            • Custom printed orders ship within 2–3 business days.<br />
            • Estimated delivery time is 5–7 business days depending on destination pincode (via DTDC Express).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">3. Order Tracking</h2>
          <p>
            As soon as your shipment is dispatched, you will receive an automated email with your DTDC tracking ID and live tracking link. You can also view live tracking details under <Link to="/account" className="text-accent underline font-semibold">Your Account</Link>.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">
          ← Back to store
        </Link>
      </div>
    </div>
  );
}
