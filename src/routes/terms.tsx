import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Weekdayzz" },
      { name: "description", content: "Terms of service and store rules for Weekdayzz." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-display text-4xl sm:text-5xl font-black mb-6">TERMS & CONDITIONS</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">1. General Overview</h2>
          <p>
            This website is operated by Weekdayzz. By visiting our site or purchasing from us, you agree to be bound by the following terms and conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">2. Product Pricing & Inventory</h2>
          <p>
            Prices for our products are subject to change without notice. All prices are listed in Indian Rupees (INR) inclusive of applicable taxes. We reserve the right to limit order quantities or cancel orders due to stock unavailability or pricing errors.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">3. Custom Prints & Graphic Uploads</h2>
          <p>
            For custom design orders (Creator Studio), customers must ensure they own or hold rights to uploaded graphics. Weekdayzz reserves the right to decline printing graphic submissions containing hate speech, illegal content, or copyright infringements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">4. Governing Law</h2>
          <p>
            These terms shall be governed and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in India.
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
