import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShoppingBag, Flag, Trophy } from "lucide-react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { MarqueeBanner } from "@/components/layout/MarqueeBanner";
import { ProductCard } from "@/components/shop/ProductCard";

const productsQ = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weekdayz — Premium Streetwear, Race-Day Drops & RCB Capsules" },
      { name: "description", content: "Cream-cut streetwear, F1 race-day capsules, and Royal Challengers Bengaluru drops. Designed to be lived in." },
      { property: "og:title", content: "Weekdayz — Built for the Weekdayz" },
      { property: "og:description", content: "Premium tees, hoodies, F1 + RCB capsules, and custom prints." },
      { property: "og:image", content: "/products/hero-cream.jpg" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQ),
  component: Index,
});

function Index() {
  const { data: products } = useSuspenseQuery(productsQ);
  return (
    <>
      <CinematicHero />
      <MarqueeBanner />
      <TrendingSection products={products} />
      <F1Section />
      <RCBSection />
      <CustomizeTeaser />
    </>
  );
}

/* ──────────────────────────────── HERO ──────────────────────────────── */
function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20, mass: 0.4 });

  const yImg = useTransform(smooth, [0, 1], ["0%", "35%"]);
  const scaleImg = useTransform(smooth, [0, 1], [1.05, 1.2]);
  const yTitle = useTransform(smooth, [0, 1], ["0%", "-45%"]);
  const yBack = useTransform(smooth, [0, 1], ["0%", "-15%"]);
  const opacity = useTransform(smooth, [0, 0.7], [1, 0]);
  const blur = useTransform(smooth, [0, 1], ["0px", "6px"]);

  return (
    <section ref={ref} className="relative min-h-[100vh] overflow-hidden bg-navy text-navy-foreground">
      {/* paper grain overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay paper-grain z-[2]" />

      {/* huge background word */}
      <motion.div
        style={{ y: yBack, opacity }}
        className="pointer-events-none absolute inset-x-0 top-[18%] z-[1] flex justify-center"
      >
        <span className="text-display text-[clamp(8rem,28vw,28rem)] leading-none text-cream/[0.06] tracking-tighter select-none">
          WEEKDAYZ
        </span>
      </motion.div>

      {/* parallax photo */}
      <motion.div style={{ y: yImg, scale: scaleImg, filter: blur as never }} className="absolute inset-0 z-[3]">
        <img
          src="/products/hero-cream.jpg"
          alt="Weekdayz hero"
          className="w-full h-full object-cover object-center opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-transparent to-navy/40" />
      </motion.div>

      {/* foreground content */}
      <motion.div
        style={{ y: yTitle, opacity }}
        className="relative z-[5] mx-auto max-w-7xl px-4 sm:px-6 pt-32 pb-16 min-h-[100vh] flex flex-col justify-end"
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-cream/80 mb-6"
        >
          <Sparkles className="h-3 w-3" /> Drop 026 · Race Week Edition
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-display text-[clamp(3.5rem,13vw,13rem)] leading-[0.82]"
        >
          ESCAPE
          <br />
          <span className="italic text-cream/90">REALITY.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid sm:grid-cols-2 gap-6 items-end"
        >
          <p className="max-w-md text-base sm:text-lg text-cream/70">
            Heavyweight tees. Garage-floor hoodies. F1 race-day capsules and the official RCB drop — all printed in Bengaluru.
          </p>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 bg-cream text-ink px-7 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-cream/90 transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" /> Shop the drop
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/create"
              className="group inline-flex items-center gap-2 border border-cream/40 text-cream px-7 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-cream hover:text-ink transition-all"
            >
              <Zap className="h-4 w-4" /> Design your own
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[6] text-[10px] uppercase tracking-[0.4em] text-cream/60 flex flex-col items-center gap-2"
      >
        Scroll
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="block h-8 w-px bg-cream/40"
        />
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────── TRENDING ──────────────────────────────── */
function TrendingSection({ products }: { products: { id: string; slug: string; title: string; price_cents: number; image_urls: string[]; category: string }[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-navy">Trending</span>
          <h2 className="text-display text-4xl sm:text-6xl mt-2">This week's <span className="italic">heat.</span></h2>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] hover:text-navy font-semibold">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────── F1 SECTION ──────────────────────────────── */
function F1Section() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink text-ink-foreground py-24 border-y-2 border-ink">
      {/* checker stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #F4F0E6 0 16px, #0A0A0A 16px 32px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #F4F0E6 0 16px, #0A0A0A 16px 32px)",
        }}
      />

      {/* marquee bg word */}
      <motion.div
        style={{ x }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-0 whitespace-nowrap"
      >
        <span className="text-display text-[clamp(8rem,22vw,22rem)] leading-none text-cream/[0.04] tracking-tighter">
          RACE · RACE · RACE · RACE
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-cream/30 text-[10px] uppercase tracking-[0.35em] text-cream/80 mb-6">
            <Flag className="h-3 w-3" /> Capsule 01
          </div>
          <h2 className="text-graffiti text-[clamp(3rem,9vw,9rem)] leading-[0.85] text-cream">
            RACE
            <br />
            DAY<span className="text-destructive">.</span>
          </h2>
          <p className="mt-6 max-w-md text-cream/70 text-base sm:text-lg">
            Checkered flags, pit-lane numerals, garage-floor grit. A capsule built for the Tifosi, Orange Army and everyone who watches lights-out at 3 AM.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "01", v: "Monaco Tee" },
              { k: "02", v: "Pit Hoodie" },
              { k: "03", v: "P1 Cap" },
            ].map((i) => (
              <div key={i.k} className="border-l-2 border-cream/30 pl-3">
                <div className="text-[10px] uppercase tracking-widest text-cream/50">{i.k}</div>
                <div className="text-sm font-semibold mt-1">{i.v}</div>
              </div>
            ))}
          </div>

          <Link
            to="/shop"
            className="mt-10 inline-flex items-center gap-2 bg-destructive text-cream px-7 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-cream hover:text-ink transition-all shadow-brutal"
          >
            <Flag className="h-4 w-4" /> Shop the grid
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          style={{ y: imgY }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="relative aspect-[4/5] overflow-hidden border-2 border-cream/20"
        >
          <img src="/products/f1-hero.jpg" alt="F1 capsule" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-cream font-bold">
            <span>F1 / 75</span>
            <span>Monaco · 2024</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink to-transparent p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cream/60">Capsule</div>
            <div className="text-cream text-xl font-bold mt-1">Three Quarters Racing Club</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── RCB SECTION ──────────────────────────────── */
function RCBSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const rot = useTransform(scrollYProgress, [0, 1], [-3, 3]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream py-24">
      {/* graffiti splatter background */}
      <motion.div
        style={{ rotate: rot }}
        aria-hidden
        className="pointer-events-none absolute -right-32 top-12 z-0 text-graffiti text-[clamp(8rem,22vw,22rem)] leading-none text-destructive/10 whitespace-nowrap"
      >
        PLAY BOLD
      </motion.div>

      {/* red splash blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-0 w-1/2 h-1/2 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, #B83227 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          style={{ y }}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="relative aspect-[4/5] overflow-hidden order-2 lg:order-1 shadow-brutal-navy"
        >
          <img src="/products/rcb-hero.jpg" alt="RCB capsule" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-4 left-4 px-2.5 py-1 bg-destructive text-cream text-[10px] uppercase tracking-[0.3em] font-bold">
            Official
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:order-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-ink text-[10px] uppercase tracking-[0.35em] text-ink mb-6">
            <Trophy className="h-3 w-3" /> Capsule 02 · Bengaluru
          </div>
          <h2 className="text-graffiti text-[clamp(3rem,10vw,10rem)] leading-[0.85] text-ink">
            PLAY
            <br />
            <span className="text-destructive">BOLD<span className="text-ink">.</span></span>
          </h2>
          <p className="mt-6 max-w-md text-ink/75 text-base sm:text-lg">
            The Royal Challengers Bengaluru capsule. Lions, brushwork, that one Chinnaswamy roar — pressed into heavyweight hoodies and oversized tees.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {["#PlayBold", "#WeAreChallengers", "#ESAS", "#Ee Sala Cup Namde"].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-ink text-cream text-[10px] uppercase tracking-[0.25em] font-bold">
                {tag}
              </span>
            ))}
          </div>

          <Link
            to="/shop"
            className="mt-10 inline-flex items-center gap-2 bg-ink text-cream px-7 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-destructive transition-all shadow-brutal-navy"
          >
            <Trophy className="h-4 w-4" /> Shop the capsule
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── CUSTOMIZE TEASER ──────────────────────────────── */
function CustomizeTeaser() {
  return (
    <section className="relative border-t-2 border-ink bg-navy text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-cream/70">Creator Studio</span>
          <h2 className="text-display text-5xl sm:text-7xl mt-3">
            Print<br />your<br /><span className="italic text-cream/90">vibe.</span>
          </h2>
          <p className="mt-6 text-cream/70 max-w-md">
            Upload your graphic, drop it on a tee, drag it where you want it. We print, you flex.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex items-center gap-2 bg-cream text-ink px-7 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-destructive hover:text-cream transition-colors"
          >
            <Zap className="h-4 w-4" /> Start designing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative aspect-square overflow-hidden border-2 border-cream/20"
        >
          <img src="/products/hero-2.jpg" alt="Custom design" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-cream text-ink text-[10px] uppercase tracking-[0.3em] font-bold">
            +₹200 / print
          </div>
        </motion.div>
      </div>
    </section>
  );
}
