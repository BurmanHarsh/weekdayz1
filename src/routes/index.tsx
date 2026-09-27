import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { listProducts } from "@/lib/products.functions";
import { listLatestReviews } from "@/lib/reviews.functions";
import { ProductCard, ProductCardData } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  StoreHeroPromoBanner,
  ValuePropsStoryScroll,
  StoreTestimonialsSection,
  BulkOrdersSection,
  StoreFaqSection,
} from "@/components/site/HomeStoreSections";
import { AdmitOneTicket } from "@/components/ui/admit-one-ticket";
import AutoLayoutCard from "@/components/ui/auto-layout-card";

import couplesImg from "@/assets/couples.png";
import shalom1Img from "@/assets/shalom-ejiofor-_7wel0dVeRA-unsplash.jpg";
import shalom2Img from "@/assets/shalom-ejiofor-RgPEQjJWBYE-unsplash.jpg";
import shalom3Img from "@/assets/shalom-ejiofor-t_prchAm4ag-unsplash.jpg";

import { fetchWebsitePosters, getWebsitePostersServer, WebsitePoster } from "@/lib/posters";
import {
  fetchLocalCategories,
  getStoreCategoriesServer,
  StoreCategory,
} from "@/lib/categories";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

const postersQuery = queryOptions({
  queryKey: ["website-posters"],
  queryFn: () => getWebsitePostersServer(),
});

const categoriesQuery = queryOptions({
  queryKey: ["store-categories"],
  queryFn: () => getStoreCategoriesServer(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(postersQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]),
  component: Home,
});


function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const listLatestReviewsFn = useServerFn(listLatestReviews);
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "latest"],
    queryFn: () => listLatestReviewsFn(),
    staleTime: 5 * 60_000,
  });

  const shopAll = (products || []).slice(0, 8);
  const spotlightProducts = (products || []).slice(0, 3);

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

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <Reveal className="text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">
            STAY IN THE LOOP
          </div>
          <h2 className="mt-2 text-display text-3xl md:text-5xl">Get 10% off your first fit.</h2>
          <p className="mt-3 text-muted-foreground">
            Drops, discounts and matchday reveals — straight to your inbox.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex max-w-md overflow-hidden border border-border"
          >
            <input
              placeholder="you@weekdayzz.in"
              className="flex-1 bg-background px-4 py-3 text-sm outline-none"
            />
            <button className="bg-foreground px-6 text-sm font-bold text-background">JOIN</button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}

/* ─── HERO CAROUSEL — Dynamic Admin Website Posters & Sliding Animation ─── */
function HeroCarousel() {
  const getPostersFn = useServerFn(getWebsitePostersServer);
  const { data: serverPosters } = useQuery({
    queryKey: ["website-posters"],
    queryFn: () => getPostersFn(),
    staleTime: 60_000,
  });

  const [localPosters, setLocalPosters] = useState<WebsitePoster[]>(() => {
    if (typeof window !== "undefined") {
      const all = fetchWebsitePosters();
      const active = all.filter((p) => p.is_active);
      return active.length > 0 ? active : all;
    }
    return [];
  });
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadPosters = () => {
      const all = fetchWebsitePosters();
      const active = all.filter((p) => p.is_active);
      setLocalPosters(active.length > 0 ? active : all);
    };
    window.addEventListener("website-posters-updated", loadPosters);
    return () => window.removeEventListener("website-posters-updated", loadPosters);
  }, []);

  const heroList = useMemo(() => {
    if (serverPosters && serverPosters.length > 0) {
      const active = serverPosters.filter((p) => p.is_active);
      if (active.length > 0) return active;
    }
    if (localPosters && localPosters.length > 0) {
      const active = localPosters.filter((p) => p.is_active);
      if (active.length > 0) return active;
    }
    return [];
  }, [serverPosters, localPosters]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseDownStart, setMouseDownStart] = useState<number | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (heroList.length === 0 || animating || idx === current) return;
      setAnimating(true);
      setCurrent(idx);
      setTimeout(() => setAnimating(false), 700);
    },
    [heroList.length, animating, current],
  );

  const goNext = useCallback(() => {
    if (heroList.length === 0) return;
    goTo((current + 1) % heroList.length);
  }, [heroList.length, goTo, current]);

  const goPrev = useCallback(() => {
    if (heroList.length === 0) return;
    goTo((current - 1 + heroList.length) % heroList.length);
  }, [heroList.length, goTo, current]);

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
    if (heroList.length === 0) return;
    timerRef.current = setInterval(goNext, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, animating, heroList.length, goNext]);

  if (heroList.length === 0) {
    return (
      <section className="relative w-full bg-neutral-950 overflow-hidden">
        <div className="relative w-full h-[75vh] sm:h-[82vh] md:h-[88vh] min-h-[520px] max-h-[920px] animate-pulse flex items-center justify-center p-6 text-center">
          <div className="max-w-xl flex flex-col items-center space-y-4">
            <div className="h-3.5 w-32 bg-white/20 rounded-full" />
            <div className="h-12 sm:h-16 w-4/5 bg-white/20 rounded-lg" />
            <div className="h-4 w-3/5 bg-white/10 rounded-full" />
            <div className="pt-4">
              <div className="h-11 w-44 border border-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-black text-white overflow-hidden group">
      <div
        className="relative w-full h-[75vh] sm:h-[82vh] md:h-[88vh] min-h-[520px] max-h-[920px] touch-pan-y select-none cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      >
        {heroList.map((s, idx) => (
          <div
            key={"id" in s && s.id ? (s.id as string) : `${s.title}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={s.img}
              alt={s.title}
              className="h-full w-full object-cover object-center"
              style={{
                transform: idx === current ? "scale(1)" : "scale(1.04)",
                transition: "transform 8s ease-out",
              }}
            />
            {/* Subtle cinematic gradient overlay to ensure text legibility while keeping image fully visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/25 pointer-events-none" />

            {/* Clean editorial typography overlay directly over image (No dark card/box) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-10 text-center z-10">
              <div className="mx-auto w-full max-w-4xl flex flex-col items-center">
                {s.badge && (
                  <span className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white font-black uppercase tracking-widest text-[10px] px-3.5 py-1 mb-3 rounded-full shadow-lg">
                    {s.badge}
                  </span>
                )}
                {s.kicker && (
                  <p className="text-xs sm:text-sm font-bold tracking-[0.35em] text-white/90 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] mb-2">
                    {s.kicker}
                  </p>
                )}
                <h1 className="text-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tight leading-[0.94] drop-shadow-[0_4px_24px_rgba(0,0,0,0.75)]">
                  {s.title}
                </h1>
                {s.sub && (
                  <p className="mt-3 sm:mt-4 text-xs sm:text-base font-medium text-white/90 tracking-wide max-w-lg drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-relaxed">
                    {s.sub}
                  </p>
                )}
                <div className="mt-7 sm:mt-8 flex justify-center">
                  <Link
                    to={s.to as unknown as "/"}
                    className="inline-flex items-center justify-center border border-white/80 bg-white/10 hover:bg-white hover:text-black text-white px-8 sm:px-10 py-3 sm:py-3.5 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase rounded-full backdrop-blur-xs transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                  >
                    {s.cta || "VIEW MORE"}
                  </Link>
                </div>
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

/* ─── CATEGORIES GRID — Circles only, dynamically configured by Admin ─── */
function CategoriesGrid() {
  const getCategoriesFn = useServerFn(getStoreCategoriesServer);
  const { data: serverCategories } = useQuery({
    queryKey: ["store-categories"],
    queryFn: () => getCategoriesFn(),
    staleTime: 60_000,
  });

  const [categories, setCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    // Hydrate from localStorage on client mount only
    const all = fetchLocalCategories();
    const active = all.filter((c) => c.is_active);
    setCategories(active.length > 0 ? active : all);

    const handleUpdate = () => {
      const all = fetchLocalCategories();
      const active = all.filter((c) => c.is_active);
      setCategories(active.length > 0 ? active : all);
    };
    window.addEventListener("categories-updated", handleUpdate);
    return () => window.removeEventListener("categories-updated", handleUpdate);
  }, []);

  const activeCategories = useMemo(() => {
    if (serverCategories && serverCategories.length > 0) {
      const active = serverCategories.filter((c) => c.is_active);
      if (active.length > 0) return active;
    }
    if (categories && categories.length > 0) {
      const active = categories.filter((c) => c.is_active);
      if (active.length > 0) return active;
    }
    return [];
  }, [serverCategories, categories]);

  if (activeCategories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <Reveal className="mb-8 text-center">
        <h2 className="text-display text-3xl sm:text-4xl font-black uppercase tracking-wider">
          BROWSE BY CATEGORY
        </h2>
      </Reveal>

      {/* Dynamic responsive grid for circle categories */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
        {activeCategories.map((c, i) => (
          <Reveal key={c.id || c.label} delay={i * 40}>
            <Link
              to={c.to as unknown as "/"}
              search={c.search}
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
        <div className="text-xs font-black tracking-[0.3em] uppercase text-center mb-4">
          NEW ARRIVALS
        </div>
        <Link
          to="/shop"
          className="group relative block overflow-hidden rounded-xl"
          style={{ paddingBottom: "56%" }}
        >
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
              <p className="text-white/70 text-xs font-bold tracking-widest uppercase mb-1">
                SS26 Collection
              </p>
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
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              FEATURED
            </div>
            <h2 className="mt-1 text-display text-2xl font-bold">Collections</h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity flex items-center gap-1"
          >
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

/* ─── STYLE SPOTLIGHT — Best sellers banner + product grid ─── */
function StyleSpotlightSection({ products }: { products: ProductCardData[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
      <Reveal>
        <div className="text-xs font-black tracking-[0.3em] uppercase text-center mb-4">
          STYLE SPOTLIGHT
        </div>
      </Reveal>

      {/* Top hero banner */}
      <Reveal>
        <Link
          to="/shop"
          className="group relative block overflow-hidden rounded-xl mb-4"
          style={{ paddingBottom: "42%" }}
        >
          <img
            src={shalom2Img}
            alt="Best Sellers"
            className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <p className="text-white/80 text-xs sm:text-sm font-bold tracking-widest uppercase mb-2">
              UP TO 50% OFF
            </p>
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
        <Link
          to="/shop"
          className="group relative block overflow-hidden rounded-xl"
          style={{ paddingBottom: "65%" }}
        >
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
function ShopAllSection({ products }: { products: ProductCardData[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4 pb-16">
      <Reveal>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              SHOP ALL
            </div>
            <h2 className="text-display text-3xl md:text-4xl mt-1 font-black">
              Fresh drops for the week
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-1 text-sm font-bold text-foreground hover:opacity-70 transition-opacity"
          >
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
