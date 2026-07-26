import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Weekdayz" },
      { name: "description", content: "Privacy policy and data handling practices at Weekdayz." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="text-display text-4xl sm:text-5xl font-black mb-6">PRIVACY POLICY</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">1. Information We Collect</h2>
          <p>
            When you visit or make a purchase from Weekdayz (weekdayz.in), we collect personal details necessary to fulfill your order. This includes your name, delivery address, phone number, email address, and IP address.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">2. How We Use Your Information</h2>
          <p>
            We use your personal information to process orders, process payment transactions through secure gateways (Razorpay), arrange shipping (Shiprocket), and communicate order updates and promotional drops.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">3. Payment Security</h2>
          <p>
            Weekdayz does not store your credit/debit card details, UPI IDs, or banking passwords. All payment transactions are encrypted and handled directly by RBI-licensed payment gateway partners (Razorpay).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">4. Cookies & Analytics</h2>
          <p>
            We use essential cookies and session data to maintain your shopping cart, authentication state, and wishlist preferences.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">5. Contact Us</h2>
          <p>
            For privacy inquiries or data requests, reach out to us at <strong className="text-accent">support@weekdayz.in</strong>.
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
