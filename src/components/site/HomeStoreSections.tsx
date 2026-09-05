import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { 
  Award, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Send
} from "lucide-react";
import FlowArt, { FlowSection } from "@/components/ui/story-scroll";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { TestimonialsColumn, type TestimonialItem } from "@/components/ui/testimonials-columns-1";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/* ==========================================
   1. HERO PROMO BANNER (Sleek Black Theme)
   ========================================== */
export function StoreHeroPromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 my-10">
      <div className="relative overflow-hidden rounded-3xl bg-black border border-white/15 text-white p-8 md:p-14 shadow-2xl">
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", 
            backgroundSize: "24px 24px" 
          }} 
        />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto py-4">
          <span className="text-xs font-bold tracking-[0.25em] uppercase bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-white/90 mb-4">
            Upgrade Your Streetwear Game
          </span>
          <h2 className="text-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Get up to 30% OFF all Products
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-xl font-medium leading-relaxed">
            Save up to 30% on selected heavy-cotton oversized tees, hoodies & fan merch this week. 
            Visit our collection page and buy now.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-3.5 rounded-full text-sm font-black tracking-wide hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 uppercase"
            >
              Shop The Sale <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   2. VALUE PROPS STORY SCROLL SECTION (GSAP FlowArt)
   ========================================== */
/* ==========================================
   2. VALUE PROPS SECTION (Custom Grid Layout matching design)
   ========================================== */
export function ValuePropsStoryScroll() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 my-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-border shadow-2xl overflow-hidden rounded-3xl">
        
        {/* LEFT COLUMN (Span 3 on LG) — 2 Stacked Feature Boxes */}
        <div className="lg:col-span-3 flex flex-col border-b lg:border-b-0 lg:border-r border-border">
          {/* Top Box: Dark Teal (#1c3d32) */}
          <div className="bg-[#1c3d32] text-white p-8 md:p-10 flex-1 flex flex-col justify-between space-y-10 min-h-[240px]">
            <div className="h-10 w-10 text-white/90">
              <Award className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">240+ GSM COTTON</h3>
              <p className="text-xs text-white/75 mt-2 leading-relaxed">
                Heavyweight luxury feel with pre-shrunk, bio-washed combed cotton for long-lasting durability.
              </p>
            </div>
          </div>

          {/* Bottom Box: Light Gray/Off-White */}
          <div className="bg-[#f0f0ee] text-foreground p-8 md:p-10 flex-1 flex flex-col justify-between space-y-10 min-h-[260px] border-t border-border">
            <div className="h-10 w-10 text-foreground">
              <Truck className="h-8 w-8 stroke-[1.5]" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">EXPRESS SHIPPING</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  2-4 day express shipping across India with real-time WhatsApp alerts.
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-full text-xs font-bold uppercase w-fit border border-border hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <ArrowRight className="h-3.5 w-3.5" /> Shop Fits
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN (Span 4 on LG) — Full-Height Portrait Model Image */}
        <div className="lg:col-span-4 relative min-h-[400px] lg:min-h-[550px] border-b lg:border-b-0 lg:border-r border-border">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
            alt="WEEKDAYZZ Streetwear"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* RIGHT COLUMN (Span 5 on LG) — 2 Stacked Rows */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Top Row: Light background with big bold stacked title */}
          <div className="bg-[#f8f8f6] text-foreground p-8 md:p-12 flex-1 flex flex-col justify-center space-y-4 border-b border-border min-h-[260px]">
            <h2 className="text-display text-4xl sm:text-5xl font-black tracking-tighter leading-[0.88] text-left sm:text-right uppercase">
              WHY<br />CHOOSE<br />US?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right max-w-xs sm:ml-auto leading-relaxed">
              Everyday we work hard to make streetwear that defines your style and vibe better and happier.
            </p>
          </div>

          {/* Bottom Row: 2 Horizontal Side-by-Side Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 flex-1">
            {/* Card 1: Dark Teal (#1c3d32) */}
            <div className="bg-[#1c3d32] text-white p-6 sm:p-8 flex flex-col justify-between space-y-8 border-b sm:border-b-0 sm:border-r border-border min-h-[220px]">
              <RotateCcw className="h-8 w-8 stroke-[1.5] text-white" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">EASY EXCHANGES</h3>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                  4-day standard exchange &amp; 2-day custom exchange.
                </p>
              </div>
            </div>

            {/* Card 2: Pure Black (#000000) */}
            <div className="bg-black text-white p-6 sm:p-8 flex flex-col justify-between space-y-8 min-h-[220px]">
              <ShieldCheck className="h-8 w-8 stroke-[1.5] text-white" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">100% PREPAID</h3>
                <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                  100% encrypted UPI, Cards &amp; NetBanking. No COD.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

/* ==========================================
   3. ANIMATED REVIEWS & TESTIMONIALS SECTION
   ========================================== */
export const storeTestimonials: TestimonialItem[] = [
  {
    text: "The 240 GSM oversized tees from WEEKDAYZZ are insane. The structure stays intact even after multiple washes, and the drop shoulder fit is perfection.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    name: "Ananya Sharma",
    role: "Verified Buyer · Bengaluru",
    stars: 5,
  },
  {
    text: "Ordered RCB official merch for match day. The print quality is top notch and delivery reached in 2 days. Highly recommended for true cricket fans!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    name: "Aarav Patel",
    role: "Matchday Crew · Delhi",
    stars: 5,
  },
  {
    text: "Customer support handled my size exchange effortlessly. 10/10 service and premium heavyweight cotton quality that rivals luxury brands.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    name: "Priyanshi Das",
    role: "Fashion Enthusiast · Mumbai",
    stars: 5,
  },
  {
    text: "The F1 Pit-Lane graphic hoodie is hands down my favorite buy this season. Bold prints, ultra-soft fleece inside, and super warm.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    name: "Rohan Verma",
    role: "Motorsport Fan · Hyderabad",
    stars: 5,
  },
  {
    text: "Placed a bulk order of 50 custom oversized hoodies for our college fest team. The sales team gave us great discounts and delivered ahead of schedule!",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    name: "Sneha Kulkarni",
    role: "College Fest Lead · Pune",
    stars: 5,
  },
  {
    text: "Clean minimalist design, heavyweight fabric, and perfect boxy fit. Fits true to size and looks aesthetic in every street style outfit.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    name: "Riya Sengupta",
    role: "Content Creator · Jaipur",
    stars: 5,
  },
  {
    text: "Fast shipping and sleek packaging. Shopping here feels reliable and effortless every single time.",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    name: "Arjun Reddy",
    role: "Sneakerhead · Kolkata",
    stars: 5,
  },
  {
    text: "The custom graphic tee printing is razor sharp. No peeling or fading after washing. Will definitely buy again!",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    name: "Kavya Menon",
    role: "Designer · Chandigarh",
    stars: 5,
  },
  {
    text: "Loved the seamless checkout with UPI and instant tracking updates on WhatsApp. WEEKDAYZZ set the bar high for D2C apparel.",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    name: "Vikramaditya Rao",
    role: "Verified Buyer · Chennai",
    stars: 5,
  },
];

const col1 = storeTestimonials.slice(0, 3);
const col2 = storeTestimonials.slice(3, 6);
const col3 = storeTestimonials.slice(6, 9);

export function StoreTestimonialsSection() {
  return (
    <section className="bg-background my-24 relative overflow-hidden py-10">
      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center">
            <div className="border border-border py-1 px-4 rounded-full text-xs font-semibold tracking-wider uppercase bg-secondary/50">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-5 text-foreground">
            What our customers say
          </h2>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Real reviews from streetwear fans, sports enthusiasts, and crew who trust Weekdayzz quality, design, and style.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-12 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={col1} duration={15} />
          <TestimonialsColumn testimonials={col2} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={col3} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   4. BULK & CORPORATE ORDERS / CONTACT SALES SECTION
   ========================================== */
export function BulkOrdersSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    quantity: "50-100",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required contact details.");
      return;
    }
    setSubmitted(true);
    toast.success("Bulk order inquiry sent! Our Sales Team will contact you within 24 hours.");
    setTimeout(() => {
      setDialogOpen(false);
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", organization: "", quantity: "50-100", notes: "" });
    }, 2000);
  };

  return (
    <section ref={sectionRef} className="py-8 px-4 sm:px-6 bg-[#f9f9f9] my-10">
      <div className="max-w-6xl mx-auto">
        <div className="relative">

          {/* ── Kicker ── */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-foreground animate-spin inline-block">✱</span>
            <span className="text-xs font-bold tracking-[0.35em] text-muted-foreground uppercase">
              BULK &amp; TEAM MERCH
            </span>
          </div>

          {/* ── Large feature image with SVG clip path ── */}
          <figure className="relative group mb-0">
            <svg className="w-full" width="100%" height="100%" viewBox="0 0 100 40">
              <defs>
                <clipPath id="clip-bulk" clipPathUnits="objectBoundingBox">
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-bulk)"
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                height="100%"
                href="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1400&auto=format&fit=crop&q=80"
              />
            </svg>
          </figure>

          {/* ── Stats row ── */}
          <div className="flex flex-wrap lg:justify-start justify-between items-center py-3 text-sm gap-x-6">
            <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
              <span className="text-foreground font-black text-lg">15+</span>
              <span className="text-muted-foreground">pieces minimum</span>
              <span className="text-border">|</span>
            </div>
            <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
              <span className="text-foreground font-black text-lg">24h</span>
              <span className="text-muted-foreground">quote turnaround</span>
              <span className="text-border">|</span>
            </div>
            <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
              <span className="text-foreground font-black text-lg">100%</span>
              <span className="text-muted-foreground">custom prints</span>
            </div>

            {/* Right-aligned large stat */}
            <div className="lg:absolute right-0 bottom-16 flex lg:flex-col flex-row-reverse lg:gap-0 gap-4">
              <div className="flex lg:text-4xl sm:text-3xl text-2xl items-center gap-2 mb-2">
                <span className="text-foreground font-black">250+</span>
                <span className="text-muted-foreground uppercase text-sm">brands served</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content 2-col ── */}
        <div className="grid md:grid-cols-3 gap-8 mt-6">
          <div className="md:col-span-2">
            <h2 className="sm:text-4xl md:text-5xl text-2xl !leading-[110%] font-black text-foreground mb-8 tracking-tight">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.08}
                staggerFrom="first"
                transition={{ type: "spring", stiffness: 250, damping: 30, delay: 0.3 }}
              >
                Custom Merch Crafted for Your Crew.
              </VerticalCutReveal>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 text-muted-foreground">
              <p className="leading-relaxed text-justify text-sm sm:text-base">
                Whether it's college fests, corporate events, sports clubs, or large-scale wholesale — Weekdayzz delivers premium screen printing, puff prints, and embroidery with tiered volume pricing.
              </p>
              <p className="leading-relaxed text-justify text-sm sm:text-base">
                Every batch gets a dedicated account manager, physical sample proofing, and end-to-end production tracking — so your brand looks exactly how you imagined it.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="grid sm:grid-cols-2 gap-3 mt-8">
              {[
                { label: "Tiered Volume Discounts", sub: "Special pricing from 15+ pieces" },
                { label: "Custom Prints & Puff Merch", sub: "Upload your art or get our designers" },
                { label: "Dedicated Account Manager", sub: "Personal support order to delivery" },
                { label: "Sample Proofing", sub: "Physical fabric review before full run" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                  <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-xs text-foreground">{item.label}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: CTA block ── */}
          <div className="md:col-span-1">
            <div className="flex flex-col gap-4 lg:items-end items-start">
              <div>
                <div className="text-foreground font-black text-2xl tracking-tight">WEEKDAYZZ</div>
                <div className="text-muted-foreground text-xs mt-0.5">Bulk & Team Merchandise</div>
              </div>

              <p className="text-sm text-foreground font-medium lg:text-right">
                Ready to get custom merch for your team?
              </p>

              {/* Dialog CTA */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="bg-foreground hover:bg-foreground/90 shadow-lg border border-foreground/20 flex w-fit items-center gap-2 hover:gap-4 transition-all duration-300 ease-in-out text-background px-5 py-3 rounded-lg cursor-pointer font-bold text-sm">
                    CONTACT SALES <ArrowRight className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Contact Bulk Sales</DialogTitle>
                    <DialogDescription>
                      Fill in your requirement and our sales team will reply within 24 hours with a custom catalog &amp; pricing.
                    </DialogDescription>
                  </DialogHeader>
                  {submitted ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg">Inquiry Received!</h3>
                      <p className="text-xs text-muted-foreground">Our sales rep will reach out shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Full Name *</label>
                          <Input required placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Phone *</label>
                          <Input required placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Email *</label>
                        <Input type="email" required placeholder="john@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Organisation</label>
                          <Input placeholder="Tech Corp / Club" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Quantity</label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          >
                            <option value="15-50">15 – 50 pieces</option>
                            <option value="50-100">50 – 100 pieces</option>
                            <option value="100-250">100 – 250 pieces</option>
                            <option value="250+">250+ pieces</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Notes / Requirements</label>
                        <Textarea placeholder="Product type, print style, deadline..." rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                      </div>
                      <Button type="submit" className="w-full font-bold">
                        Submit Inquiry <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              {/* Quick contact links */}
              <div className="flex flex-col gap-2 w-full lg:items-end">
                <a href="mailto:sales@weekdayzz.in?subject=Bulk%20Order%20Inquiry" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> sales@weekdayzz.in
                </a>
                <a href="tel:+919876543210" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" /> +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   5. FREQUENTLY ASKED QUESTIONS (FAQ Accordion)
   ========================================== */
export function StoreFaqSection() {
  const faqs = [
    {
      q: "How long does shipping take?",
      a: "Standard shipping across India takes 2 to 4 business days for metro cities, and 4 to 6 business days for rest of India. Express 2-day delivery options are also available at checkout.",
    },
    {
      q: "Do you offer bulk discounts or custom orders?",
      a: "Yes! We specialize in custom team, corporate, and college fest merchandise. Orders above 15 pieces qualify for tiered wholesale discounts. Click the 'Contact Sales Team' button above to get a custom quote within 24 hours.",
    },
    {
      q: "What is the fabric quality of Weekdayzz apparel?",
      a: "All Weekdayzz oversized tees and hoodies are crafted from 100% premium combed cotton (240+ GSM for tees, 380+ GSM fleece for hoodies). They are pre-shrunk, bio-washed, and designed for maximum comfort and durability.",
    },
    {
      q: "Can I return or exchange a product?",
      a: "We do not accept returns. However, we offer an exchange window: standard orders within 4 days after delivery (standard size or color exchange); custom orders within 2 days after delivery (valid only if wrong size or incorrect print/design was delivered).",
    },
    {
      q: "Are payments secure? Do you accept COD?",
      a: "All orders are 100% prepaid only. Cash on Delivery (COD) is not accepted. We accept 100% encrypted UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and NetBanking via Razorpay.",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 my-24">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Everything you need to know before placing your order.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-3">
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={idx}
            value={`faq-${idx}`}
            className="border border-border/80 rounded-2xl px-6 py-1 bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/40"
          >
            <AccordionTrigger className="text-base font-semibold py-5 text-foreground hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
