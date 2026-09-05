import { createFileRoute, Link } from "@tanstack/react-router";
import { StorePoliciesNotice } from "@/components/shop/StorePoliciesNotice";
import { ShieldCheck, AlertCircle, RotateCcw, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Store & Exchange Policy — Weekdayzz" },
      { name: "description", content: "Official exchange guidelines and store policy for Weekdayzz standard and custom orders." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.25em] text-accent font-bold">Official Store Guidelines</span>
        <h1 className="text-display text-4xl sm:text-5xl font-black mt-2">STORE &amp; EXCHANGE POLICIES</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Clear, transparent policies for Standard Orders and Custom Printed Orders.
        </p>
      </div>

      {/* Main Policy Matrix Table */}
      <div className="my-8">
        <StorePoliciesNotice />
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90 mt-12">
        <section className="bg-card border border-border p-6 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs">
            <PackageCheck className="h-4 w-4" />
            <span>1. 100% Prepaid Only (No COD)</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            All orders on Weekdayzz must be 100% prepaid at the time of checkout. We accept UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards (Visa, MasterCard, RuPay), NetBanking, and verified digital wallets via 256-bit encrypted Razorpay. Cash on Delivery (COD) is strictly not accepted for both standard and custom orders.
          </p>
        </section>

        <section className="bg-card border border-border p-6 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-destructive font-bold uppercase tracking-wider text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>2. Return Policy — No Returns Accepted</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            In order to maintain strict hygiene standards and bespoke production cycles, Weekdayzz does not accept returns or refunds for any order once dispatched. Please refer to our detailed sizing guides prior to placing an order.
          </p>
        </section>

        <section className="bg-card border border-border p-6 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-wider text-xs">
            <RotateCcw className="h-4 w-4 text-accent" />
            <span>3. Standard Orders: 4-Day Exchange Window</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            For all standard catalog drops and products, you can request an exchange <strong>within 4 days after delivery</strong>. Exchange conditions cover standard size or color replacements. The garment must be completely unused, unwashed, and retained with all original tags attached.
          </p>
        </section>

        <section className="bg-card border border-border p-6 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-wider text-xs">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>4. Custom Orders: 2-Day Exchange Window</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Because custom orders are custom printed individually to your specifications, exchange requests must be submitted <strong>within 2 days after delivery</strong>. Exchange is valid <em>only</em> if the wrong size was delivered or an incorrect print/defective graphic was printed on our part. Please provide clear unboxing photos or videos to support@weekdayzz.in.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">
          ← Back to Store
        </Link>
        <Link to="/create" className="text-xs font-bold uppercase tracking-widest text-foreground hover:underline">
          Create Custom Print →
        </Link>
      </div>
    </div>
  );
}
