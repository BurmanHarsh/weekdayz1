import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listProducts } from "@/lib/products.functions";
import { listLatestReviews } from "@/lib/reviews.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";

import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import rcbFeature from "@/assets/rcb-feature.jpg";
import f1Feature from "@/assets/f1-feature.jpg";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Home,
});

const HERO = [
  { img: hero1, kicker: "JUST DROPPED · LIMITED STOCK", title: "RCB EDITION '26", sub: "Cheer in style with the official oversized fit.", badge: "FLAT 20% OFF", to: "/collections/$slug" as const, params: { slug: "rcb" }, cta: "GRAB YOURS" },
  { img: hero2, kicker: "BESTSELLER · SS26", title: "THE OVERSIZED EDIT", sub: "Premium heavyweight cotton. Minimal branding. Maximum comfort.", badge: "BUY 2 GET 10% OFF", to: "/shop" as const, params: undefined, cta: "SHOP THE LOOK" },
  { img: hero3, kicker: "PREMIUM CAPSULE", title: "F1 PIT-LANE", sub: "Carbon detailing. Race-day ready. The ultimate speed aesthetic.", badge: "NEW ARRIVAL", to: "/collections/$slug" as const, params: { slug: "f1" }, cta: "EXPLORE NOW" },
];

const CATS = [
  { label: "Tees", cat: "tee" },
  { label: "Oversized", cat: "hoodie" },
  { label: "Hoodies", cat: "hoodie" },
  { label: "Jerseys", cat: "jersey" },
  { label: "Accessories", cat: "accessories" },
];

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const listLatestReviewsFn = useServerFn(listLatestReviews);
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "latest"],
    queryFn: () => listLatestReviewsFn(),
    staleTime: 5 * 60_000,
  });

  const trending = products.slice(0, 8);

  return (
    <div className="w-full">
      <HeroCarousel />
      <CategoryStrip />
      <DealBanner />
      <RcbBlock />
      <F1Block />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-bold tracking-widest text-primary uppercase">TRENDING NOW</div>
              <h2 className="text-display text-3xl md:text-4xl mt-1">Fresh drops for the week</h2>
            </div>
            <Link to="/shop" className="hidden md:inline-flex items-center gap-1 text-sm font-bold text-primary">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trending.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <ReviewsMarquee reviews={reviews} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <Reveal className="text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">STAY IN THE LOOP</div>
          <h2 className="mt-2 text-display text-3xl md:text-5xl">Get 10% off your first fit.</h2>
          <p className="mt-3 text-muted-foreground">Drops, discounts and matchday reveals — straight to your inbox.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md overflow-hidden rounded-md border border-border">
            <input placeholder="you@weekdayz.in" className="flex-1 bg-background px-4 py-3 text-sm outline-none" />
            <button className="bg-primary px-6 text-sm font-bold text-primary-foreground">JOIN</button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}

function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % HERO.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="relative overflow-hidden bg-black text-white group">
      <div className="relative h-[75vh] min-h-[560px] w-full">
        {HERO.map((s, idx) => (
          <div
            key={s.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === i ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img src={s.img} alt="" className="h-full w-full object-cover object-center scale-105 transform transition-transform duration-[10000ms]" style={{ transform: idx === i ? "scale(1)" : "scale(1.05)" }} width={1920} height={960} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="max-w-lg">
                  {s.badge && (
                    <div className="inline-block bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-sm shadow-md mb-4 transform -skew-x-6">
                      {s.badge}
                    </div>
                  )}
                  <div className="text-xs font-bold tracking-[0.3em] text-white/80 uppercase">{s.kicker}</div>
                  <h1 className="mt-2 text-display text-5xl md:text-7xl leading-[0.95] font-black text-white">{s.title}</h1>
                  <p className="mt-4 text-lg md:text-xl text-white/85 font-medium leading-relaxed">{s.sub}</p>
                  {s.params ? (
                    <Link to={s.to as any} params={s.params as any} className="mt-8 inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-black tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,0,0,0.39)]">
                      {s.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to={s.to as any} className="mt-8 inline-flex items-center justify-center bg-white text-black px-10 py-4 text-xs font-black tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,0,0,0.39)]">
                      {s.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
          {HERO.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? "w-12 bg-primary" : "w-4 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="grid grid-cols-5 gap-3 sm:gap-6">
        {CATS.map((c, i) => (
          <Reveal key={c.label} delay={i * 80}>
            <Link to="/shop" search={{ category: c.cat }} className="group flex flex-col items-center gap-2">
              <div className="grid h-16 w-16 sm:h-24 sm:w-24 place-items-center rounded-full bg-secondary border border-border transition-colors group-hover:bg-primary/10">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground">{c.label.slice(0, 2)}</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.label}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function DealBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <Link to="/shop" search={{ category: "tee" }} className="relative block h-56 overflow-hidden bg-brand-ink text-white rounded-lg hover-lift">
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <div className="text-xs tracking-[0.3em] text-primary uppercase font-bold">DEAL OF THE DAY</div>
                <div className="mt-2 text-3xl font-black">Oversized tees<br />from ₹899</div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-white">SHOP NOW <ArrowRight className="h-4 w-4" /></div>
              </div>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <Link to="/shop" search={{ category: "hoodie" }} className="relative block h-56 overflow-hidden bg-primary text-primary-foreground rounded-lg hover-lift">
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <div className="text-xs tracking-[0.3em] text-white/80 uppercase font-bold">WINTER READY</div>
                <div className="mt-2 text-3xl font-black">Hoodies<br />flat 30% off</div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-foreground">SHOP NOW <ArrowRight className="h-4 w-4" /></div>
              </div>
            </div>
          </Link>
        </Reveal>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="bg-primary text-primary-foreground text-[10px] px-2 py-1 font-bold uppercase tracking-widest rounded-sm">BRAND SPOTLIGHT</span>
                  <span className="text-xs font-bold tracking-[0.4em] text-white/80 uppercase">RCB × WEEKDAYZ</span>
                </div>
                <h2 className="text-display text-5xl md:text-7xl mt-2 font-black leading-[0.9]">Red never leaves.</h2>
                <p className="mt-4 text-white/70 text-lg">The 2026 limited edition collection. Exclusively on Weekdayz.</p>
              </div>
              <Link to="/collections/$slug" params={{ slug: "rcb" }} className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all shadow-lg shrink-0">
                SHOP COLLECTION <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-[5fr_7fr] relative z-10">
            <div className="md:sticky md:top-24 md:self-start group cursor-pointer">
              <Reveal>
                <Link to="/collections/$slug" params={{ slug: "rcb" }} className="block relative aspect-[4/5] overflow-hidden rounded-xl border border-white/20 shadow-2xl">
                  <img src={rcbFeature} alt="RCB collection" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
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
                    <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/10 group-hover:from-primary group-hover:to-primary/30 transition-all duration-300 -mt-2">
                      {s.k}
                    </div>
                    <div>
                      <h3 className="text-display text-2xl md:text-3xl font-bold">{s.t}</h3>
                      <p className="mt-2 max-w-md text-white/60 text-sm md:text-base leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function F1Block() {
  const cards = [
    { t: "Podium Chrome", d: "Metallic finishes.", n: "01", p: "₹1999", slug: "f1-racewear-graphic-tee" },
    { t: "Pit Lane", d: "Utility & carbon.", n: "02", p: "₹2499", slug: "ferrari-scuderia-drop-tee" },
    { t: "Speed Line", d: "Race-day graphics.", n: "03", p: "₹2299", slug: "redbull-pit-crew-tee" },
    { t: "Driver Series", d: "Race-cut jackets.", n: "04", p: "₹1999", slug: "f1-racewear-graphic-tee" },
    { t: "Chequer Pack", d: "Caps & socks.", n: "05", p: "₹1999", slug: "f1-racewear-graphic-tee" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
      <section className="f1-wash text-white mt-20 rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="bg-[#E10600] text-white text-[10px] px-2 py-1 font-bold uppercase tracking-widest rounded-sm animate-pulse">NEW ARRIVAL</span>
                  <span className="text-xs font-bold tracking-[0.4em] text-white/60 uppercase">FORMULA · WEEKDAYZ</span>
                </div>
                <h2 className="text-display text-5xl md:text-7xl mt-2 font-black italic tracking-tighter">Built for the pit lane.</h2>
                <p className="mt-4 text-white/70 text-lg">Chrome, carbon and checker-flag details. A capsule inspired by 200mph decisions.</p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs font-bold tracking-widest text-white/50 uppercase">
                <span className="h-px w-16 bg-[#E10600]" />
                <span>Swipe to explore</span>
              </div>
            </div>
          </Reveal>

          <div className="mb-12 overflow-hidden relative rounded-2xl group cursor-pointer border border-white/10 shadow-2xl">
            <Reveal>
              <Link to="/collections/$slug" params={{ slug: "f1" }} className="block relative">
                <img src={f1Feature} alt="F1 feature" loading="lazy" className="w-full object-cover h-72 md:h-[500px] transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-4xl md:text-6xl font-black italic text-white drop-shadow-lg">THE RACING EDIT</h3>
                  <div className="mt-4 inline-flex items-center gap-2 bg-[#E10600] text-white px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-[#E10600] transition-colors shadow-lg">
                    SHOP THE CAPSULE <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </Reveal>
          </div>

          <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 -mx-4 px-4 no-scrollbar">
            {cards.map((c, i) => (
              <Reveal key={c.n} delay={i * 80}>
                <Link to="/product/$slug" params={{ slug: c.slug }} className="block snap-start shrink-0 w-72 md:w-80 border border-white/10 bg-white/5 hover:bg-white/10 p-8 rounded-xl transition-all duration-300 hover:border-[#E10600] group shadow-xl">
                  <div className="flex justify-between items-start mb-12">
                    <div className="text-sm font-bold text-white/40 group-hover:text-[#E10600] transition-colors">VOL. {c.n}</div>
                    <div className="text-xs font-bold bg-white/10 px-2 py-1 rounded-sm text-white/80 group-hover:bg-[#E10600] group-hover:text-white transition-colors">{c.p}</div>
                  </div>
                  <div>
                    <h4 className="text-display text-2xl md:text-3xl font-bold italic">{c.t}</h4>
                    <p className="mt-2 text-sm text-white/60">{c.d}</p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest text-white/40 uppercase group-hover:text-white transition-colors">
                      VIEW PRODUCT <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewsMarquee({ reviews }: { reviews: Array<{ id: string; reviewer_name: string; rating: number; body: string }> }) {
  if (!reviews.length) return null;
  const doubled = [...reviews, ...reviews];
  return (
    <section className="border-y border-border bg-secondary py-12 overflow-hidden">
      <Reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-6 text-center">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">LOVED BY OUR CREW</div>
          <h2 className="text-display text-3xl md:text-4xl mt-1">15k+ 5-star reviews</h2>
        </div>
      </Reveal>
      <div className="marquee flex gap-4 w-max">
        {doubled.map((r, i) => (
          <div key={r.id + i} className="w-80 shrink-0 border border-border bg-background p-5 rounded-lg shadow-sm">
            <Stars value={r.rating} />
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">{r.body}</p>
            <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">— {r.reviewer_name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
