import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — Weekdayzz" },
      { name: "description", content: "Returns, replacements and refund policy for Weekdayzz orders." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-display text-4xl sm:text-5xl font-black mb-6">RETURNS & REFUNDS</h1>
      <p className="text-sm text-muted-foreground mb-8">Hassle-free 15-day returns policy</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">1. 15-Day Easy Returns</h2>
          <p>
            We accept returns and size exchanges within 15 days of delivery for all standard catalog items, provided the garments are unworn, unwashed, with original tags intact.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">2. Damaged or Defective Goods</h2>
          <p>
            If you received a defective print, wrong size, or damaged item, contact us within 48 hours of delivery with unboxing photos/videos at <strong className="text-accent">support@weekdayz.in</strong> for an immediate free replacement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">3. Custom Print Orders</h2>
          <p>
            Custom print orders (printed on-demand from user-uploaded graphics) are non-refundable unless there is a physical manufacturing defect or printing error on our part.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">4. Refund Timeline</h2>
          <p>
            Once returned items are received and inspected at our warehouse, approved refunds will be credited back to your original payment method within 5–7 business days.
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
