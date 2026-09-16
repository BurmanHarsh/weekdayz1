import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef, useMemo } from "react";
import { listProducts } from "@/lib/products.functions";
import { listLatestReviews } from "@/lib/reviews.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import {
  StoreHeroPromoBanner,
  ValuePropsStoryScroll,
  StoreTestimonialsSection,
  BulkOrdersSection,
  StoreFaqSection,
} from "@/components/site/HomeStoreSections";
import { AdmitOneTicket } from "@/components/ui/admit-one-ticket";
import AutoLayoutCard from "@/components/ui/auto-layout-card";

import teesImg from "@/assets/tees.png";
import couplesImg from "@/assets/couples.png";
import statementImg from "@/assets/statement.png";
import pinterestImg from "@/assets/pinterest finds.png";
import jacketsImg from "@/assets/jackets.png";
import hoodieImg from "@/assets/hoodie.png";
import cricketImg from "@/assets/cricket.png";
import bulkImg from "@/assets/bulk.png";
import shalom1Img from "@/assets/shalom-ejiofor-_7wel0dVeRA-unsplash.jpg";
import shalom2Img from "@/assets/shalom-ejiofor-RgPEQjJWBYE-unsplash.jpg";
import shalom3Img from "@/assets/shalom-ejiofor-t_prchAm4ag-unsplash.jpg";
import heroCottonbro from "@/assets/pexels-cottonbro-6069083.jpg";
import heroFreestock from "@/assets/pexels-freestockpro-7444126.jpg";
import heroJohnRae from "@/assets/pexels-john-rae-cayabyab-1570188-4944121.jpg";
import heroVisualkevv from "@/assets/pexels-visualkevv-28076806.jpg";
import heroSynthesis from "@/assets/SYNTHESIS _ PROTOTYPE 04 - JANIS SNE.jpeg";
import { fetchWebsitePosters, getWebsitePostersServer, WebsitePoster, DEFAULT_POSTERS } from "@/lib/posters";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")(({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
} as any));

export const HERO_SLIDES: WebsitePoster[] = [
  {
    id: "poster-street-culture",
    img: heroCottonbro,
    kicker: "NEW ARRIVALS · SS26",
    title: "STREET CULTURE",
    sub: "Engineered oversized fits and heavyweight drops for the new era.",
    badge: "NEW DROP",
    to: "/shop",
    cta: "SHOP COLLECTION",
    is_active: true,
  },
  {
    id: "poster-minimal-edit",
    img: heroFreestock,
    kicker: "LIMITED EDITION",
    title: "THE MINIMAL EDIT",
    sub: "Uncompromising quality. 240+ GSM crafted everyday essentials.",
    badge: "FLAT 20% OFF",
    to: "/shop",
    cta: "EXPLORE NOW",
    is_active: true,
  },
  {
    id: "poster-signature",
    img: heroJohnRae,
    kicker: "WEEKDAYZZ SIGNATURE",
    title: "RAW & REFINED",
    sub: "Statement graphics and modern silhouettes made to turn heads.",
    badge: "BESTSELLER",
    to: "/shop",
    cta: "SHOP THE LOOK",
    is_active: true,
  },
  {
    id: "poster-urban-essentials",
    img: heroVisualkevv,
    kicker: "TRENDING NOW",
    title: "URBAN ESSENTIALS",
    sub: "Everyday luxury streetwear designed for effortless styling.",
    badge: "FROM ₹500",
    to: "/shop",
    cta: "DISCOVER MORE",
    is_active: true,
  },
  {
    id: "poster-future-synthesis",
    img: heroSynthesis,
    kicker: "EXCLUSIVE DROP",
    title: "FUTURE SYNTHESIS",
    sub: "Experimental cuts, avant-garde textures, and signature fits.",
    badge: "HIGH DEMAND",
    to: "/shop",
    cta: "GRAB YOURS",
    is_active: true,
  },
];

// Exactly 8 categories transformed into clean circles (no card box)
const CATS = [
  { label: "Tees", cat: "tee", img: teesImg, to: "/shop", search: { category: "tee" } },
  { label: "Couple", cat: "couple", img: couplesImg, to: "/collections/couple" },
  { label: "Statement", cat: "statement", img: statementImg, to: "/shop", search: { category: "statement" } },
  { label: "Pinterest", cat: "pinterest", img: pinterestImg, to: "/shop", search: { category: "pinterest" } },
  { label: "Jackets", cat: "jacket", img: jacketsImg, to: "/shop", search: { category: "jacket" } },
  { label: "Hoodies", cat: "hoodie", img: hoodieImg, to: "/shop", search: { category: "hoodie" } },
  { label: "Sports & Fan", cat: "sports", img: cricketImg, to: "/collections/rcb" },
  { label: "Bulk Orders", cat: "bulk", img: bulkImg, to: "/bulk-orders" },
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
  const spotlightProducts = products.slice(0, 3);

  return (
    <div className="w-full">
      <HeroCarousel />
      <CategoriesGrid />
      <NewArrivalsBanner />
      <CustomizerBanner />
      <CollectionsGrid />
      <StyleSpotlightSection products={spotlightProducts} />
      <NewSeasonBanner />
      <ShopAllSection products={shopAll} />
      <BulkOrdersSection />
      <StoreHeroPromoBanner />
      <ValuePropsStoryScroll />
      <StoreTestimonialsSection />
      <StoreFaqSection />
    </div>
  );
}

/* ─── HERO CAROUSEL — Fashion-brand style: text directly on image ─── */
function HeroCarousel() {
  const getPostersFn = useServerFn(getWebsitePostersServer);
  const { data: serverPosters } = useQuery({
    queryKey: ["website-posters"],
    queryFn: () => getPostersFn(),
    staleTime: 60_000,
  });

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroList = useMemo(() => {
    if (serverPosters && serverPosters.length >= 5) {
      const active = serverPosters.filter((p) => p.is_active);
      const isLegacy = active.some((p) => p.id === "poster-rcb-26");
      if (!isLegacy && active.length >= 5) return active;
    }
    return HERO_SLIDES;
  }, [serverPosters]);

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
  const onTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 40) goNext();
    else if (distance < -40) goPrev();
  };
  const onMouseDown = (e: React.MouseEvent) => { setMouseDownStart(e.clientX); };
  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseDownStart === null) return;
    const distance = mouseDownStart - e.clientX;
    setMouseDownStart(null);
    if (distance > 40) goNext();
    else if (distance < -40) goPrev();
  };

  useEffect(() => {
    timerRef.current = setInterval(goNext, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, animating, heroList.length]);

  return (
    <section className="relative bg-black text-white overflow-hidden group">
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
            {/* Full-bleed image */}
            <img
              src={s.img}
              alt={s.title}
              className="h-full w-full object-cover object-center"
              style={{ transform: idx === current ? "scale(1)" : "scale(1.04)", transition: "transform 8s ease-out" }}
            />

            {/* Multi-layer gradient for text legibility — heavy at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

            {/* Text directly on image — bottom-left fashion brand style */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-14 z-10">
              {/* Badge pill */}
              {s.badge && (
                <span className="inline-block self-start bg-white text-black font-black uppercase tracking-widest text-[10px] sm:text-xs px-3 py-1 mb-3 shadow-lg">
                  {s.badge}
                </span>
              )}
              {/* Kicker */}
              <div className="text-[10px] sm:text-xs font-bold tracking-[0.3em] text-white/70 uppercase mb-2">
                {s.kicker}
              </div>
              {/* Big bold title */}
              <h1 className="text-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] font-black text-white max-w-2xl uppercase">
                {s.title}
              </h1>
              {/* Sub text */}
              <p className="mt-3 text-sm sm:text-base text-white/75 font-medium leading-relaxed max-w-md">
                {s.sub}
              </p>
              {/* CTA */}
              <div className="mt-6">
                <Link
                  to={s.to as any}
                  className="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-xs font-black tracking-widest uppercase hover:bg-white/90 hover:gap-3 active:scale-95 transition-all duration-300 shadow-2xl"
                >
                  {s.cta || "SHOP ALL"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Left arrow */}
        <button
          onClick={goPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {/* Right arrow */}
        <button
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
          {heroList.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => goTo(idx)}
              className={`h-[3px] rounded-full transition-all duration-500 ${idx === current ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-6 left-6 sm:left-10 md:left-14 z-20 text-white/50 text-xs font-bold tracking-widest">
          {String(current + 1).padStart(2, "0")} / {String(heroList.length).padStart(2, "0")}
        </div>
      </div>
    </section>
  );
}

/* ─── CATEGORIES GRID — Circles only, no card boxes ─── */
function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <Reveal className="mb-8 text-center">
        <h2 className="text-display text-3xl sm:text-4xl font-black uppercase tracking-wider">
          BROWSE BY CATEGORY
        </h2>
      </Reveal>

      {/* 4 columns on desktop/tablet, 4 on mobile — circles only, no card box */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
        {CATS.map((c, i) => (
          <Reveal key={c.label} delay={i * 40}>
            <Link
              to={c.to as any}
              search={(c as any).search}
              className="group flex flex-col items-center text-center gap-3"
            >
              {/* Circle image only — no card background */}
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-border/60 group-hover:border-foreground transition-all duration-300 shadow-sm bg-muted/30">
                <img
                  src={c.img}
                  alt={c.label}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              {/* Label below circle */}
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors leading-tight">
                {c.label}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─── NEW ARRIVALS BANNER — Editorial full-width fashion banner ─── */
function NewArrivalsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
      <Reveal>
        <div className="text-xs font-black tracking-[0.3em] uppercase text-center mb-4">NEW ARRIVALS</div>
        <Link to="/shop" className="group relative block overflow-hidden rounded-xl" style={{ paddingBottom: "56%" }}>
          <img
            src={shalom1Img}
            alt="New Arrivals"
            className="absolute inset-0 h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />
          {/* Gradient overlay — strong at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Text overlay — bottom left */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">SS26 Collection</p>
              <div className="text-white font-black text-3xl sm:text-5xl md:text-6xl leading-none uppercase tracking-tight">
                FROM ₹500
              </div>
            </div>
            <span className="inline-flex items-center gap-2 bg-white text-black text-xs font-black tracking-widest uppercase px-6 py-3 group-hover:bg-black group-hover:text-white border border-white transition-all duration-300">
              SHOP NOW <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </Reveal>
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
            title={<>Couple <br /> Collection</>}
            subtitle="SS26 Match Edition • Oversized Fits for Two"
            badge="POPULAR"
            mainImage={couplesImg}
            logoImage="/logo.png"
            extraImages={[
              "/products/certified-yapper-listener-couple.png",
              "/products/calm-admi-kaleshi-aurat-black.png",
              "/products/calm-admi-kaleshi-aurat-white.png",
            ]}
            linkTo="/collections/couple"
          />
        </Reveal>
        <Reveal delay={120}>
          <AutoLayoutCard
            title={<>Trending <br /> Streetwear</>}
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

/* ─── STYLE SPOTLIGHT — Best sellers banner + product grid ─── */
function StyleSpotlightSection({ products }: { products: any[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
      <Reveal>
        <div className="text-xs font-black tracking-[0.3em] uppercase text-center mb-4">STYLE SPOTLIGHT</div>
      </Reveal>

      {/* Top hero banner */}
      <Reveal>
        <Link to="/shop" className="group relative block overflow-hidden rounded-xl mb-4" style={{ paddingBottom: "42%" }}>
          <img
            src={shalom2Img}
            alt="Best Sellers"
            className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <p className="text-white/80 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2">UP TO 50% OFF</p>
            <div className="text-white font-black text-4xl sm:text-6xl md:text-7xl leading-none uppercase tracking-tight mb-4">
              BEST SELLERS
            </div>
            <span className="inline-flex items-center gap-2 border border-white text-white text-xs font-black tracking-widest uppercase px-8 py-3 group-hover:bg-white group-hover:text-black transition-all duration-300">
              SHOP NOW
            </span>
          </div>
        </Link>
      </Reveal>

      {/* Product grid — 3 cards */}
      {products.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── NEW SEASON PROMO BANNER — Bold full-bleed editorial ─── */
function NewSeasonBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
      <Reveal>
        <Link to="/shop" className="group relative block overflow-hidden rounded-xl" style={{ paddingBottom: "65%" }}>
          <img
            src={shalom3Img}
            alt="New Season Collection"
            className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          {/* Dark overlay — centre-focused for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

          {/* Text — centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <span className="inline-block border border-white/60 text-white/80 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase px-4 py-1 mb-4">
              NEW SEASON
            </span>
            <div className="text-white font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.92] uppercase tracking-tight mb-2">
              FROM ₹500
            </div>
            <div className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-tight uppercase tracking-wide mb-6 opacity-90">
              + EXTRA 20% OFF
            </div>
            <span className="inline-flex items-center gap-2 border border-white text-white text-xs font-black tracking-widest uppercase px-8 py-3.5 group-hover:bg-white group-hover:text-black transition-all duration-300">
              SHOP NOW <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </Reveal>
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
