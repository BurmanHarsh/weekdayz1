import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Send, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Award, 
  Truck, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Package,
  Layers,
  Palette
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StorePoliciesNotice } from "@/components/shop/StorePoliciesNotice";
import bulkImg from "@/assets/bulk.png";

export const Route = createFileRoute("/bulk-orders")({
  head: () => ({
    meta: [
      { title: "Bulk & Corporate Custom Orders | WEEKDAYZZ" },
      { name: "description", content: "Order custom merchandise for your college fest, corporate team, sports club or brand. Tiered volume discounts from 15+ pieces." },
      { property: "og:title", content: "Bulk & Team Merch — WEEKDAYZZ" },
    ],
  }),
  component: BulkOrdersPage,
});

export default function BulkOrdersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    garmentType: "Oversized Tees (240 GSM)",
    quantity: "50-100",
    printType: "Screen Print / Puff Print",
    deadline: "",
    requirements: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please provide your name, email, and phone number.");
      return;
    }
    if (!formData.requirements.trim()) {
      toast.error("Please enter your custom requirement details.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Bulk order inquiry submitted! Our team will contact you within 24 hours.");
    }, 800);
  };

  return (
    <div className="w-full min-h-screen pb-24">
      {/* ── HERO BANNER ── */}
      <section className="relative bg-black text-white py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", 
            backgroundSize: "28px 28px" 
          }} 
        />
        <div className="mx-auto max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-white/90">
              Wholesale &amp; Custom Team Apparel
            </span>
            <h1 className="text-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
              Bulk Merch Crafted for Your Crew.
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-lg">
              Custom oversized tees, hoodies, and jackets engineered for college fests, corporate teams, startups, and community drops.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#inquiry-form"
                className="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full text-xs font-black uppercase tracking-wider hover:bg-white/90 transition-all shadow-xl"
              >
                Submit Custom Request <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/919876543210?text=Hi%20Weekdayzz,%20I%20want%20to%20inquire%20about%20a%20bulk%20order."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
              >
                <Phone className="h-4 w-4" /> WhatsApp Sales
              </a>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-br from-zinc-900 to-black p-4 flex items-center justify-center">
              <img
                src={bulkImg}
                alt="Bulk Merchandise"
                className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">Tiered Volume Pricing</div>
                  <div className="text-[11px] text-white/70">From 15+ to 10,000+ pieces</div>
                </div>
                <span className="bg-white text-black font-black text-[10px] px-2.5 py-1 rounded-full uppercase">
                  Up to 40% OFF
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIERS & VALUE PROPS ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 my-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Volume Pricing</span>
          <h2 className="text-display text-3xl sm:text-4xl font-black mt-1">Tiered Wholesale Discounts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            The larger your squad, the bigger your savings. Every tier includes free graphic consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { tier: "Squad", qty: "15 – 49 Pcs", discount: "15% OFF", sub: "Ideal for club committees & small batches" },
            { tier: "Crew", qty: "50 – 99 Pcs", discount: "25% OFF", sub: "Perfect for departments & student fests" },
            { tier: "Brand", qty: "100 – 249 Pcs", discount: "32% OFF", sub: "Designed for corporate summits & runs" },
            { tier: "Wholesale", qty: "250+ Pcs", discount: "40% OFF", sub: "Maximum wholesale pricing with custom labels" },
          ].map((t) => (
            <div key={t.tier} className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-between hover:border-foreground/40 transition-all shadow-sm group">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.tier} Tier</div>
                <div className="text-2xl font-black mt-1 text-foreground">{t.qty}</div>
                <div className="inline-block mt-3 text-sm font-black bg-foreground text-background px-3 py-1 rounded-full">
                  {t.discount}
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{t.sub}</p>
              </div>
              <div className="pt-6 border-t border-border mt-6 flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-accent transition-colors">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Sample proofing included</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEDICATED INQUIRY FORM SECTION ── */}
      <section id="inquiry-form" className="mx-auto max-w-4xl px-4 sm:px-6 my-16">
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="border-b border-border pb-6 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Direct Sales Desk</span>
            <h2 className="text-display text-3xl sm:text-4xl font-black mt-1">Submit Bulk Requirement</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tell us about your garment style, printing specs, and quantity. We'll reply with a custom mock-up and quote.
            </p>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black">Inquiry Received!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Thank you, <strong>{formData.name}</strong>. Our dedicated bulk sales manager has received your requirement for <strong>{formData.quantity}</strong> pieces and will connect via WhatsApp/Email within 24 hours.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    organization: "",
                    garmentType: "Oversized Tees (240 GSM)",
                    quantity: "50-100",
                    printType: "Screen Print / Puff Print",
                    deadline: "",
                    requirements: "",
                  });
                }}
                className="mt-4 text-xs font-bold uppercase tracking-wider"
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Phone / WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="priya@college.edu or name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Organisation / College / Brand
                  </label>
                  <Input
                    placeholder="e.g. IIT Fest Committee / Tech Startup"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Garment Silhouette
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.garmentType}
                    onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                  >
                    <option value="Oversized Tees (240 GSM)">Oversized Tees (240 GSM)</option>
                    <option value="Heavyweight Hoodies (380 GSM)">Heavyweight Hoodies (380 GSM)</option>
                    <option value="Polo T-Shirts">Polo T-Shirts</option>
                    <option value="Regular Fit Tees">Regular Fit Tees</option>
                    <option value="Varsity / Street Jackets">Varsity / Street Jackets</option>
                    <option value="Sweatshirts">Sweatshirts</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Approx. Quantity
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  >
                    <option value="15-49">15 – 49 pieces</option>
                    <option value="50-100">50 – 100 pieces</option>
                    <option value="100-250">100 – 250 pieces</option>
                    <option value="250-500">250 – 500 pieces</option>
                    <option value="500+">500+ pieces</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Target Delivery Date
                  </label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              {/* Requirement text field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Custom Requirements &amp; Specifications <span className="text-destructive">*</span>
                </label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Describe your design, print locations (Front/Back/Sleeves), print style (Screen print, Puff print, HD Print, Embroidery), color preferences, or any custom details..."
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  You can also paste Google Drive / Figma / Dropbox links to your high-resolution logos or graphic assets.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 text-xs font-black uppercase tracking-widest gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? "Submitting Request…" : "Submit Custom Bulk Request"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* ── STORE POLICIES NOTICE ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 my-12">
        <StorePoliciesNotice />
      </section>
    </div>
  );
}
