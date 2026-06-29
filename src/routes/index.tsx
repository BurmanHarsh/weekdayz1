import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles, Zap, ShoppingBag } from "lucide-react";
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
      { title: "Weekdayz — Premium Gen-Z Streetwear" },
      { name: "description", content: "Shop premium tees, hoodies, and design your own custom prints. New drops every week." },
      { property: "og:title", content: "Weekdayz — Premium Gen-Z Streetwear" },
      { property: "og:description", content: "Built for the always-online generation. New drops every week." },
      { property: "og:image", content: "/products/hero-1.jpg" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQ),
  component: Index,
});

function Index() {
  const { data: products } = useSuspenseQuery(productsQ);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yTitle = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <>
      {/* HERO */}
      <section ref={ref} className="relative min-h-[92vh] overflow-hidden border-b border-border">
        <motion.div style={{ y: yImg }} className="absolute inset-0">
          <img
            src="/products/hero-1.jpg"
            alt="Weekdayz hero"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        <motion.div
          style={{ y: yTitle }}
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-32 pb-20 min-h-[92vh] flex flex-col justify-end"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent mb-6"
          >
            <Sparkles className="h-3 w-3" /> New drop · Week 26
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.85]"
          >
            BUILT FOR
            <br />
            <span className="text-accent italic">WEEKDAYZ.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-md text-base sm:text-lg text-muted-foreground"
          >
            Heavyweight tees, premium hoodies, and custom prints. Made for late nights, lazy mornings, and everything in between.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Shop Collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/create"
              className="group inline-flex items-center gap-2 border border-foreground/30 px-7 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background transition-colors"
            >
              <Zap className="h-4 w-4" /> Design Your Own
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <MarqueeBanner />

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-accent">Trending now</span>
            <h2 className="text-display text-4xl sm:text-6xl mt-2">This week's heat.</h2>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-accent">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CUSTOMIZE TEASER */}
      <section className="relative border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-accent">Creator Studio</span>
            <h2 className="text-display text-5xl sm:text-7xl mt-3">Print<br />your<br /><span className="text-accent">vibe.</span></h2>
            <p className="mt-6 text-muted-foreground max-w-md">
              Upload your graphic, drop it on a tee, drag it where you want it. We print, you flex.
            </p>
            <Link
              to="/create"
              className="mt-8 inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
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
            className="relative aspect-square bg-card border border-border overflow-hidden"
          >
            <img src="/products/hero-2.jpg" alt="Custom design" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest font-bold">
              +₹200 / print
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
