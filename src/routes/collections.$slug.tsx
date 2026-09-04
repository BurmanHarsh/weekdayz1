import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import rcbFeature from "@/assets/rcb-feature.jpg";
import f1Feature from "@/assets/f1-feature.jpg";
import { useServerFn } from "@tanstack/react-start";

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProducts(),
});

const COLLECTIONS: Record<
  string,
  {
    title: string;
    tagline: string;
    kicker: string;
    image?: string;
    wash: string;
    match: (title: string, cat: string) => boolean;
  }
> = {
  rcb: {
    title: "RCB Collection",
    tagline: "Ee sala cup namde. Cheer bold, wear bolder.",
    kicker: "PLAY BOLD",
    image: rcbFeature,
    wash: "rcb-wash",
    match: (title, cat) => /rcb/i.test(title) || /rcb/i.test(cat),
  },
  f1: {
    title: "F1 Collection",
    tagline: "Chrome, carbon and 200mph decisions.",
    kicker: "FULL THROTTLE",
    image: f1Feature,
    wash: "f1-wash",
    match: (title, cat) => /f1|formula/i.test(title) || /f1|formula/i.test(cat),
  },
  couple: {
    title: "Couple Collection",
    tagline: "Matching fits designed for two. Wear your bond out loud.",
    kicker: "MATCHING ENERGIES",
    wash: "bg-gradient-to-br from-rose-950 via-zinc-900 to-black",
    match: (title, cat) => /couple|matching|yapper|sally/i.test(title) || /couple|matching/i.test(cat),
  },
  oversized: {
    title: "Oversized Collection",
    tagline: "240 GSM heavy cotton with effortless drape and room to breathe.",
    kicker: "SIGNATURE CUT",
    wash: "bg-gradient-to-br from-neutral-900 via-stone-900 to-black",
    match: (title, cat) => /oversized|drop/i.test(title) || /oversized/i.test(cat),
  },
  trending: {
    title: "Trending Drops",
    tagline: "The most requested weekday pieces in rotation right now.",
    kicker: "NOW TRENDING",
    wash: "bg-gradient-to-br from-amber-950 via-zinc-900 to-black",
    match: () => true,
  },
  statement: {
    title: "Statement Tees",
    tagline: "High-density graphics and typography that speak before you do.",
    kicker: "LOUD & CLEAR",
    wash: "bg-gradient-to-br from-indigo-950 via-zinc-900 to-black",
    match: (title, cat) => /statement|graphic/i.test(title) || /statement|graphic/i.test(cat),
  },
  pinterest: {
    title: "Pins & Aesthetic",
    tagline: "Minimalist and vintage-inspired cuts right off your moodboard.",
    kicker: "PINS & MOODS",
    wash: "bg-gradient-to-br from-teal-950 via-zinc-900 to-black",
    match: (title, cat) => /pin|aesthetic/i.test(title) || /pin|aesthetic/i.test(cat),
  },
};

function resolveCollection(slug: string) {
  const norm = slug.toLowerCase();
  if (COLLECTIONS[norm]) return COLLECTIONS[norm];
  const cleanTitle = norm.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${cleanTitle} Collection`,
    tagline: `Explore handpicked ${cleanTitle} pieces from Weekdayzz.`,
    kicker: "CURATED DROP",
    wash: "bg-gradient-to-br from-zinc-900 via-neutral-900 to-black",
    match: (title: string, cat: string) =>
      title.toLowerCase().includes(norm) || cat.toLowerCase().includes(norm),
  };
}

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const c = resolveCollection(params.slug);
    if (!c) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery);
  },
  head: ({ params }) => {
    const c = resolveCollection(params.slug);
    return {
      meta: c
        ? [
            { title: `${c.title} — Weekdayzz` },
            { name: "description", content: c.tagline },
            { property: "og:title", content: `${c.title} — Weekdayzz` },
            { property: "og:description", content: c.tagline },
          ]
        : [],
    };
  },
  component: Collection,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-3xl font-black">Collection not found</h1>
      <Link to="/shop" className="mt-6 inline-block bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Back to shop</Link>
    </div>
  ),
});

function Collection() {
  const { slug } = Route.useParams();
  const c = resolveCollection(slug);
  const { data: all } = useSuspenseQuery(productsQuery);
  const items = all.filter((p) => c.match(p.title, p.category));

  return (
    <div>
      <section className={`${c.wash} text-white`}>
        <div className={`mx-auto max-w-7xl px-4 py-20 md:py-28 ${c.image ? "grid md:grid-cols-2 gap-10 items-center" : "text-center max-w-3xl"}`}>
          <Reveal>
            <div className="text-xs font-bold tracking-[0.4em] text-accent uppercase">{c.kicker}</div>
            <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">{c.title}</h1>
            <p className="mt-4 max-w-xl mx-auto text-white/75 text-base sm:text-lg">{c.tagline}</p>
          </Reveal>
          {c.image && (
            <Reveal delay={150}>
              <img src={c.image} alt="" className="w-full aspect-[4/5] object-cover rounded-md border border-white/20 shadow-2xl" />
            </Reveal>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-widest">No products currently matching this collection</p>
            <Link to="/shop" className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-sm">
              Explore all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={i * 50}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
