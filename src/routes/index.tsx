import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { listProducts } from "@/lib/products.functions";
import { listLatestReviews } from "@/lib/reviews.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, Users, TrendingUp, Star, Zap } from "lucide-react";
import {
  StoreHeroPromoBanner,
  ValuePropsStoryScroll,
  StoreTestimonialsSection,
  BulkOrdersSection,
  StoreFaqSection,
} from "@/components/site/HomeStoreSections";
import { AdmitOneTicket } from "@/components/ui/admit-one-ticket";
import AutoLayoutCard from "@/components/ui/auto-layout-card";

import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { fetchWebsitePosters, WebsitePoster } from "@/lib/posters";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")(  {
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

const HERO = [
  {
    img: hero1,
    kicker: "JUST DROPPED · LIMITED STOCK",
    title: "RCB EDITION '26",
    sub: "Cheer in style with the official oversized fit.",
    badge: "FLAT 20% OFF",
    to: "/collections/$slug" as const,
    params: { slug: "rcb" },
    cta: "GRAB YOURS",
  },
  {
    img: hero2,
    kicker: "BESTSELLER · SS26",
    title: "THE OVERSIZED EDIT",
    sub: "Premium heavyweight cotton. Minimal branding. Maximum comfort.",
    badge: "BUY 2 GET 10% OFF",
    to: "/shop" as const,
    params: undefined,
    cta: "SHOP THE LOOK",
  },
  {
    img: hero3,
    kicker: "PREMIUM CAPSULE",
    title: "F1 PIT-LANE",
    sub: "Carbon detailing. Race-day ready. The ultimate speed aesthetic.",
    badge: "NEW ARRIVAL",
    to: "/collections/$slug" as const,
    params: { slug: "f1" },
    cta: "EXPLORE NOW",
  },
];

// Exactly 8 categories, 4 per row (2 rows)
const CATS = [
  { label: "Tees", cat: "tee", emoji: "👕" },
  { label: "Couple", cat: "couple", emoji: "💑" },
  { label: "Statement", cat: "statement", emoji: "✌️" },
  { label: "Pinterest", cat: "pinterest", emoji: "📌" },
  { label: "Jackets", cat: "jacket", emoji: "🧥" },
  { label: "Hoodies", cat: "hoodie", emoji: "🦔" },
  { label: "Bottoms", cat: "bottom", emoji: "👖" },
  { label: "Bulk", cat: "bulk", emoji: "📦" },
];

// Featured collections for grid
const COLLECTIONS = [
  {
    label: "Couple Tees",
    desc: "Match your vibe together",
    slug: "couple",
    bg: "from-rose-50 to-pink-100",
    accent: "#e11d48",
    emoji: "💑",
  },
  {
    label: "Trending Now",
    desc: "What everyone's wearing",
    slug: "trending",
    bg: "from-amber-50 to-orange-100",
    accent: "#f97316",
    emoji: "🔥",
  },
];

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const listLatestReviewsFn = useServerFn(listLatestReviews);
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "latest"],
    queryFn: () => listLatestReviewsFn(),
    staleTime: 5 * 60_000,
  });

  const shopAll = products.slice(0, 8);

  return (
    <div className="w-full">
      <HeroCarousel />
      <CategoriesGrid />
      <CustomizerBanner />
      <CollectionsGrid />
      <ShopAllSection products={shopAll} />
      <StoreHeroPromoBanner />
      <ValuePropsStoryScroll />
      <StoreTestimonialsSection />
      <BulkOrdersSection />
      <StoreFaqSection />

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <Reveal className="text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">STAY IN THE LOOP</div>
          <h2 className="mt-2 text-display text-3xl md:text-5xl">Get 10% off your first fit.</h2>
          <p className="mt-3 text-muted-foreground">Drops, discounts and matchday reveals — straight to your inbox.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md overflow-hidden border border-border">
            <input placeholder="you@weekdayzz.in" className="flex-1 bg-background px-4 py-3 text-sm outline-none" />
            <button className="bg-foreground px-6 text-sm font-bold text-background">JOIN</button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}

/* ─── HERO CAROUSEL — Dynamic Admin Website Posters & Sliding Animation ─── */
function HeroCarousel() {
  const [posters, setPosters] = useState<WebsitePoster[]>([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadPosters = () => {
      const all = fetchWebsitePosters();
      const active = all.filter((p) => p.is_active);
      setPosters(active.length > 0 ? active : all);
    };
    loadPosters();
    window.addEventListener("website-posters-updated", loadPosters);
    return () => window.removeEventListener("website-posters-updated", loadPosters);
  }, []);

  const heroList = posters.length > 0 ? posters : HERO;

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseDownStart, setMouseDownStart] = useState<number | null>(null);

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  };

  const goNext = () => goTo((current + 1) % heroList.length);
  const goPrev = () => goTo((current - 1 + heroList.length) % heroList.length);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 40) {
      goNext();
    } else if (distance < -40) {
      goPrev();
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setMouseDownStart(e.clientX);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseDownStart === null) return;
    const distance = mouseDownStart - e.clientX;
    setMouseDownStart(null);
    if (distance > 40) {
      goNext();
    } else if (distance < -40) {
      goPrev();
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(goNext, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, animating, heroList.length]);

  return (
    <section className="relative bg-black text-white overflow-hidden group">
      {/* 3:4 on mobile, tall cinematic on desktop */}
      <div
        className="relative w-full touch-pan-y select-none cursor-grab active:cursor-grabbing"
        style={{ paddingBottom: "min(75%, 90vh)" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {heroList.map((s, idx) => (
          <div
            key={("id" in s && s.id) ? (s.id as string) : `${s.title}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={s.img}
              alt={s.title}
              className="h-full w-full object-cover object-center"
              style={{ transform: idx === current ? "scale(1)" : "scale(1.04)", transition: "transform 8s ease-out" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
            <div className="absolute inset-0 flex items-end pb-16 md:items-center md:pb-0">
              <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
                <div className="max-w-md">
                  {s.badge && (
                    <span className="inline-block bg-white text-black font-black uppercase tracking-widest text-[10px] px-3 py-1 mb-4 shadow-md">
                      {s.badge}
                    </span>
                  )}
                  <div className="text-[10px] font-bold tracking-[0.3em] text-white/70 uppercase mb-2">{s.kicker}</div>
                  <h1 className="text-display text-4xl md:text-6xl lg:text-7xl leading-[0.92] font-black text-white">{s.title}</h1>
                  <p className="mt-4 text-base md:text-lg text-white/80 font-medium leading-relaxed">{s.sub}</p>
                  <div className="mt-8">
                    <Link
                      to={s.to as any}
                      className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 text-xs font-black tracking-widest uppercase hover:bg-foreground hover:text-white transition-all duration-300 shadow-lg"
                    >
                      {s.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Left / Right arrows */}
        <button
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all opacity-0 group-hover:opacity-100"
        >
          &lsaquo;
        </button>
        <button
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all opacity-0 group-hover:opacity-100"
        >
          &rsaquo;
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {heroList.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={`h-1 rounded-full transition-all duration-500 ${idx === current ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-6 right-6 z-20 text-white/60 text-xs font-bold tracking-widest">
          {String(current + 1).padStart(2, "0")} / {String(heroList.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}

/* ─── CATEGORIES GRID — Exactly 4 per row, 2 rows, circular icons, NO carousel ─── */
function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <Reveal className="mb-6 text-center">
        <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">BROWSE BY CATEGORY</div>
        <h2 className="mt-1 text-display text-2xl font-bold">Shop Your Style</h2>
      </Reveal>
      {/* Strictly 4-column grid — static, no slider */}
      <div className="grid grid-cols-4 gap-4 sm:gap-6">
        {CATS.map((c, i) => (
          <Reveal key={c.label} delay={i * 50}>
            <Link
              to="/shop"
              search={{ category: c.cat }}
              className="group flex flex-col items-center gap-2 sm:gap-3"
            >
              <div className="h-14 w-14 sm:h-20 sm:w-20 flex items-center justify-center rounded-full bg-black text-white border border-black shadow-md transition-transform duration-300 group-hover:scale-105">
                <span className="text-xl sm:text-3xl font-black">{c.label.charAt(0)}</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-center uppercase tracking-wider text-foreground group-hover:text-foreground/70 transition-colors leading-tight">
                {c.label}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─── CUSTOMIZER BANNER — Admit One Ticket Style ─── */
function CustomizerBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4 pb-10">
      <Reveal>
        <AdmitOneTicket
          title="CREATE YOUR OWN"
          subtitle="Customise any type of print. Upload your graphic, pick a fit, print your vibe."
          tags={["CUSTOM", "COUPLE", "TRENDING", "FESTIVE"]}
          ctaText="START DESIGNING"
          to="/create"
        />
      </Reveal>
    </section>
  );
}

/* ─── COLLECTIONS GRID — AutoLayoutCard featured blocks ─── */
function CollectionsGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4 pb-12">
      <Reveal className="mb-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">FEATURED</div>
            <h2 className="mt-1 text-display text-2xl font-bold">Collections</h2>
          </div>
          <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Reveal delay={0}>
          <AutoLayoutCard
            title={
              <>
                Couple <br /> Collection
              </>
            }
            subtitle="SS26 Match Edition • Oversized Fits"
            badge="POPULAR"
            mainImage="https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1740&auto=format&fit=crop"
            logoImage="/logo.png"
            extraImages={[
              "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=1742&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1740&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1740&auto=format&fit=crop",
            ]}
            linkTo="/shop"
            linkSearch={{ category: "couple" }}
          />
        </Reveal>
        <Reveal delay={120}>
          <AutoLayoutCard
            title={
              <>
                Trending <br /> Streetwear
              </>
            }
            subtitle="Top Picked Drops • Heavyweight Cotton"
            badge="HOT DROPS"
            mainImage="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1740&auto=format&fit=crop"
            logoImage="/logo.png"
            extraImages={[
              "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1740&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1740&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1740&auto=format&fit=crop",
            ]}
            linkTo="/shop"
            linkSearch={{ category: "tee" }}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── SHOP ALL SECTION — 2-column product grid ─── */
function ShopAllSection({ products }: { products: any[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4 pb-16">
      <Reveal>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">SHOP ALL</div>
            <h2 className="text-display text-3xl md:text-4xl mt-1 font-black">Fresh drops for the week</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-1 text-sm font-bold text-foreground hover:opacity-70 transition-opacity">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 border border-foreground bg-transparent text-foreground px-8 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-300"
        >
          View All Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function RcbBlock() {
  const stories = [
    { k: "01", t: "OFFICIAL MERCH", d: "Signal-red fits built for cheer-block chaos. Authentic prints, unmatched energy." },
    { k: "02", t: "PREMIUM 240 GSM", d: "Heavyweight cotton oversized tees. Loud, loved, and made to last." },
    { k: "03", t: "MATCH DAY FITS", d: "Jerseys, hoodies, caps — the ultimate fan kit for every season." },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
      <section className="rcb-wash text-white mt-20 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 relative">
          <div className="absolute top-10 right-10 opacity-10 text-[10rem] font-black leading-none uppercase select-none pointer-events-none hidden lg:block">PLAY<br />BOLD</div>
          <Reveal>
            <div className="flex flex-col mb-12 relative z-10">
              <div className="max-w-2xl">
                <h2 className="text-display text-5xl md:text-7xl font-black leading-[0.9]">Red never leaves.</h2>
                <p className="mt-4 text-white/70 text-lg">The 2026 limited edition collection. Exclusively on WEEKDAYZZ.</p>
              </div>
            </div>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-[5fr_7fr] relative z-10">
            <div className="md:sticky md:top-24 md:self-start group cursor-pointer">
              <Reveal>
                <Link to="/collections/$slug" params={{ slug: "rcb" }} className="block relative aspect-[4/5] overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black/40 p-6 flex items-center justify-center">
                  <img src="/rcb-seeklogo.png" alt="RCB collection" className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors">
                      <span className="font-bold tracking-wider uppercase text-sm">View Lookbook</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            </div>
            <div className="space-y-12 md:py-8 flex flex-col justify-center">
              {stories.map((s, i) => (
                <Reveal key={s.k} delay={i * 120}>
                  <div className="flex gap-6 group">
                    <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/10 group-hover:from-white group-hover:to-white/30 transition-all duration-300 -mt-2">
                      {s.k}
                    </div>
                    <div>
                      <h3 className="text-display text-2xl md:text-3xl font-bold">{s.t}</h3>
                      <p className="mt-2 max-w-md text-white/60 text-sm md:text-base leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={400}>
                <div className="pt-4">
                  <Link to="/collections/$slug" params={{ slug: "rcb" }} className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-foreground hover:text-white transition-all shadow-lg shrink-0 rounded-md">
                    SHOP COLLECTION <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
