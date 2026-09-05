import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Weekdayzz" },
      { name: "description", content: "Privacy policy and data handling practices at Weekdayzz." },
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
            When you visit or make a purchase from Weekdayzz (weekdayzz.in), we collect personal details necessary to fulfill your order. This includes your name, delivery address, phone number, email address, and IP address.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">2. How We Use Your Information</h2>
          <p>
            Your information is used exclusively to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Process transactions, calculate taxes, and generate invoices.</li>
            <li>Coordinate pan-India shipping and deliver status notifications via SMS, email, and WhatsApp.</li>
            <li>Prevent fraudulent transactions and protect platform integrity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">3. Payment Security</h2>
          <p>
            We partner with Razorpay for all transaction processing. We do not store your credit/debit card numbers, UPI PINs, or CVVs on our servers. All transaction traffic is encrypted with industry-standard 256-bit SSL protocols.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">4. Third-Party Sharing</h2>
          <p>
            We only disclose essential shipping details (name, delivery address, contact phone) to logistics partners (Shiprocket, DTDC) to complete order dispatch. We will never sell, rent, or trade your personal data to external marketing agencies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3">5. Contact Us</h2>
          <p>
            For privacy inquiries or data requests, reach out to us at <strong className="text-accent">support@weekdayzz.in</strong>.
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
