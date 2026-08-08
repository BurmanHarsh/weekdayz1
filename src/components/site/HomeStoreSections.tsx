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
   1. HERO PROMO BANNER (Purple Gradient)
   ========================================== */
export function StoreHeroPromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 my-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white p-8 md:p-14 shadow-2xl">
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", 
            backgroundSize: "24px 24px" 
          }} 
        />
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto py-4">
          <span className="text-xs font-bold tracking-[0.25em] uppercase bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 mb-4">
            Upgrade Your Streetwear Game
          </span>
          <h2 className="text-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Get up to 30% OFF all Products
          </h2>
          <p className="mt-4 text-base sm:text-lg text-purple-100 max-w-xl font-medium leading-relaxed">
            Save up to 30% on selected heavy-cotton oversized tees, hoodies & fan merch this week. 
            Visit our collection page and buy now.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-white text-purple-950 px-8 py-3.5 rounded-full text-sm font-bold tracking-wide hover:bg-purple-100 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
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
export function ValuePropsStoryScroll() {
  return (
    <div className="my-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-8 text-center">
        <span className="text-xs font-bold tracking-widest text-primary uppercase bg-secondary px-3 py-1 rounded-full">
          WHY WEEKDAYZ
        </span>
        <h2 className="text-display text-3xl sm:text-4xl md:text-5xl font-extrabold mt-3">
          Our Brand Commitments
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-2">
          Scroll down to discover our standards of quality, delivery, exchange, and security.
        </p>
      </div>

      <FlowArt aria-label="Weekdayz Brand Promises">
        {/* Section 1: Premium Quality */}
        <FlowSection aria-label="Premium Quality" style={{ backgroundColor: '#111827', color: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">01 — Premium Quality</p>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/20" />
          <div>
            <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-black leading-[0.9] uppercase tracking-tight">
              240+ GSM
              <br />
              Heavyweight
              <br />
              Cotton
            </h2>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/20" />
          <p className="max-w-[55ch] text-[clamp(1.1rem,2vw,1.8rem)] font-medium leading-relaxed text-white/90">
            Built with 240+ GSM heavyweight cotton for long-lasting durability. Pre-shrunk, bio-washed, and drop-shoulder boxy fits engineered to hold shape wash after wash.
          </p>
          <hr className="my-[1.5vw] border-none border-t border-white/20" />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-400">240 GSM Fabric</p>
              <p className="text-sm leading-relaxed text-white/70">Heavyweight luxury feel with breathable, soft combed cotton texture.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-400">Bio-Washed Finish</p>
              <p className="text-sm leading-relaxed text-white/70">Anti-pilling treatment for ultra-smooth texture and vibrant color retention.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-400">Precision Stitching</p>
              <p className="text-sm leading-relaxed text-white/70">Double-needle neckband & reinforced shoulder taping for active wear.</p>
            </div>
          </div>
        </FlowSection>

        {/* Section 2: Fast Shipping */}
        <FlowSection aria-label="Fast Shipping" style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-sky-200" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200">02 — Fast Shipping</p>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div>
            <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-black leading-[0.9] uppercase tracking-tight">
              Quick &
              <br />
              Express
              <br />
              Delivery
            </h2>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <p className="max-w-[55ch] text-[clamp(1.1rem,2vw,1.8rem)] font-medium leading-relaxed text-white/95">
            Quick and secure delivery, wherever you are across India. Orders leave our fulfillment center within 24 hours with real-time WhatsApp & SMS tracking.
          </p>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-sky-200">2-4 Day Transit</p>
              <p className="text-sm leading-relaxed text-white/80">Express air shipping to all major metros and Tier 1 cities.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-sky-200">Live WhatsApp Alerts</p>
              <p className="text-sm leading-relaxed text-white/80">Automated dispatch, out-for-delivery, and delivery updates.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-sky-200">Free Over ₹999</p>
              <p className="text-sm leading-relaxed text-white/80">Zero shipping fee on all orders above ₹999 across India.</p>
            </div>
          </div>
        </FlowSection>

        {/* Section 3: Easy Returns */}
        <FlowSection aria-label="Easy Returns" style={{ backgroundColor: '#166534', color: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-6 w-6 text-emerald-300" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">03 — Easy Returns</p>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div>
            <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-black leading-[0.9] uppercase tracking-tight">
              15-Day
              <br />
              Hassle-Free
              <br />
              Exchange
            </h2>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <p className="max-w-[55ch] text-[clamp(1.1rem,2vw,1.8rem)] font-medium leading-relaxed text-white/95">
            15-day hassle-free exchange and full refund policy. If the size isn't right or you want a different color, our courier picks it up directly from your doorstep.
          </p>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-300">Doorstep Pickup</p>
              <p className="text-sm leading-relaxed text-white/80">No need to visit a post office — our agent collects the return from your home.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-300">Instant Store Credit</p>
              <p className="text-sm leading-relaxed text-white/80">Get store credit or bank refund credited immediately upon quality check.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-300">Zero Exchange Fee</p>
              <p className="text-sm leading-relaxed text-white/80">First size exchange is 100% free of charge for all customers.</p>
            </div>
          </div>
        </FlowSection>

        {/* Section 4: Secure Checkout */}
        <FlowSection aria-label="Secure Checkout" style={{ backgroundColor: '#4c1d95', color: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-purple-300" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-300">04 — Secure Checkout</p>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div>
            <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-black leading-[0.9] uppercase tracking-tight">
              Protected
              <br />
              Encrypted
              <br />
              Payments
            </h2>
          </div>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <p className="max-w-[55ch] text-[clamp(1.1rem,2vw,1.8rem)] font-medium leading-relaxed text-white/95">
            Protected payments with UPI, NetBanking & COD options. Powered by Razorpay with end-to-end 256-bit SSL encryption.
          </p>
          <hr className="my-[1.5vw] border-none border-t border-white/30" />
          <div className="flex flex-wrap gap-[3vw]">
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-purple-300">Instant UPI & Cards</p>
              <p className="text-sm leading-relaxed text-white/80">Google Pay, PhonePe, Paytm, Visa, Mastercard, and Rupay supported.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-purple-300">COD Option Available</p>
              <p className="text-sm leading-relaxed text-white/80">Pay cash upon delivery anywhere in India with verified OTP check.</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-purple-300">Buyer Protection</p>
              <p className="text-sm leading-relaxed text-white/80">100% money-back guarantee if an order is delayed or damaged.</p>
            </div>
          </div>
        </FlowSection>
      </FlowArt>
    </div>
  );
}

/* ==========================================
   3. ANIMATED REVIEWS & TESTIMONIALS SECTION
   ========================================== */
export const storeTestimonials: TestimonialItem[] = [
  {
    text: "The 240 GSM oversized tees from Weekdayz are insane. The structure stays intact even after multiple washes, and the drop shoulder fit is perfection.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    name: "Briana Patton",
    role: "Verified Buyer · Bengaluru",
    stars: 5,
  },
  {
    text: "Ordered RCB official merch for match day. The print quality is top notch and delivery reached in 2 days. Highly recommended for true cricket fans!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    name: "Bilal Ahmed",
    role: "Matchday Crew · Delhi",
    stars: 5,
  },
  {
    text: "Customer support handled my size exchange effortlessly. 10/10 service and premium heavyweight cotton quality that rivals luxury brands.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    name: "Saman Malik",
    role: "Fashion Enthusiast · Mumbai",
    stars: 5,
  },
  {
    text: "The F1 Pit-Lane graphic hoodie is hands down my favorite buy this season. Bold prints, ultra-soft fleece inside, and super warm.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    name: "Omar Raza",
    role: "Motorsport Fan · Hyderabad",
    stars: 5,
  },
  {
    text: "Placed a bulk order of 50 custom oversized hoodies for our college fest team. The sales team gave us great discounts and delivered ahead of schedule!",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    name: "Zainab Hussain",
    role: "College Fest Lead · Pune",
    stars: 5,
  },
  {
    text: "Clean minimalist design, heavyweight fabric, and perfect boxy fit. Fits true to size and looks aesthetic in every street style outfit.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    name: "Aliza Khan",
    role: "Content Creator · Jaipur",
    stars: 5,
  },
  {
    text: "Fast shipping and sleek packaging. Shopping here feels reliable and effortless every single time.",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    name: "Farhan Siddiqui",
    role: "Sneakerhead · Kolkata",
    stars: 5,
  },
  {
    text: "The custom graphic tee printing is razor sharp. No peeling or fading after washing. Will definitely buy again!",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    name: "Sana Sheikh",
    role: "Designer · Chandigarh",
    stars: 5,
  },
  {
    text: "Loved the seamless checkout with UPI and instant tracking updates on WhatsApp. Weekdayz set the bar high for D2C apparel.",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    name: "Hassan Ali",
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
            Real reviews from streetwear fans, sports enthusiasts, and crew who trust Weekdayz quality, design, and style.
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
      setFormData({
        name: "",
        email: "",
        phone: "",
        organization: "",
        quantity: "50-100",
        notes: "",
      });
    }, 2000);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 my-24">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 md:p-14 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" /> BULK & TEAM MERCH
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Planning Bulk or Custom Orders for Your Team?
            </h2>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
              Whether it’s for college fests, corporate events, sports clubs, or wholesale merch — Weekdayz offers custom screen printing, puff prints, embroidery, and tiered wholesale pricing. Contact our sales team today.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Tiered Volume Discounts</h4>
                  <p className="text-xs text-muted-foreground">Special pricing starting at 15+ pieces.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Custom Prints & Puff Merch</h4>
                  <p className="text-xs text-muted-foreground">Upload your designs or let our artists assist.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Dedicated Account Manager</h4>
                  <p className="text-xs text-muted-foreground">Personalized support from order to delivery.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Sample Proofing</h4>
                  <p className="text-xs text-muted-foreground">Physical fabric & sample review before full run.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-primary text-primary-foreground font-bold px-8 py-6 text-sm rounded-xl shadow-lg hover:shadow-primary/25">
                    Contact Sales Team <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Contact Bulk Sales</DialogTitle>
                    <DialogDescription>
                      Fill in your requirement and our sales representative will get back to you with custom catalog & pricing within 24 hours.
                    </DialogDescription>
                  </DialogHeader>

                  {submitted ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg">Inquiry Received!</h3>
                      <p className="text-xs text-muted-foreground">Our sales representative will reach out to you shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Full Name *</label>
                          <Input
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Phone Number *</label>
                          <Input
                            required
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Work / Email *</label>
                        <Input
                          type="email"
                          required
                          placeholder="john@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Organization / College</label>
                          <Input
                            placeholder="Tech Corp / Club"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Estimated Quantity</label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          >
                            <option value="15-50">15 - 50 pieces</option>
                            <option value="50-100">50 - 100 pieces</option>
                            <option value="100-250">100 - 250 pieces</option>
                            <option value="250+">250+ pieces</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Custom Details / Notes</label>
                        <Textarea
                          placeholder="Tell us about product type (tees/hoodies), print requirements or deadline..."
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>

                      <Button type="submit" className="w-full font-bold">
                        Submit Bulk Inquiry <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              <a
                href="mailto:sales@weekdayz.in?subject=Bulk%20Order%20Inquiry"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-4 py-3 border border-border rounded-xl"
              >
                <Mail className="h-4 w-4" /> Email: sales@weekdayz.in
              </a>

              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-4 py-3 border border-border rounded-xl"
              >
                <Phone className="h-4 w-4" /> Sales: +91 98765 43210
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-border group">
              <img
                src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80"
                alt="Bulk orders apparel printing"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-primary px-2 py-0.5 rounded-sm">
                  CUSTOM BATCH PRODUCTION
                </span>
                <h3 className="text-xl font-bold">High GSM Fabric & Custom Prints</h3>
                <p className="text-xs text-white/80">Tailored to your exact brand aesthetics.</p>
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
      q: "What is the fabric quality of Weekdayz apparel?",
      a: "All Weekdayz oversized tees and hoodies are crafted from 100% premium combed cotton (240+ GSM for tees, 380+ GSM fleece for hoodies). They are pre-shrunk, bio-washed, and designed for maximum comfort and durability.",
    },
    {
      q: "Can I return or exchange a product?",
      a: "Absolutely! We offer a hassle-free 15-day exchange and return policy. If the fit isn't perfect or you change your mind, simply initiate a request from your account or contact support for doorstep pickup.",
    },
    {
      q: "Are payments secure?",
      a: "Yes, 100% secure. We partner with Razorpay to accept UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, NetBanking, and Cash on Delivery (COD) with full end-to-end encryption.",
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
