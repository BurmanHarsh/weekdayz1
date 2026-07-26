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
    image: string;
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
};

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    if (!COLLECTIONS[params.slug]) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery);
  },
  head: ({ params }) => {
    const c = COLLECTIONS[params.slug];
    return {
      meta: c
        ? [
            { title: `${c.title} — Weekdayz` },
            { name: "description", content: c.tagline },
            { property: "og:title", content: `${c.title} — Weekdayz` },
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
  const c = COLLECTIONS[slug]!;
  const { data: all } = useSuspenseQuery(productsQuery);
  const items = all.filter((p) => c.match(p.title, p.category));

  return (
    <div>
      <section className={`${c.wash} text-white`}>
        <div className="mx-auto max-w-7xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <div className="text-xs font-bold tracking-[0.4em] text-accent">{c.kicker}</div>
            <h1 className="mt-3 text-5xl md:text-7xl font-black leading-[0.95]">{c.title}</h1>
            <p className="mt-4 max-w-md text-white/70 text-lg">{c.tagline}</p>
          </Reveal>
          <Reveal delay={150}>
            <img src={c.image} alt="" className="w-full aspect-[4/5] object-cover rounded-md border border-white/20" />
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-24 text-center text-muted-foreground">Coming soon — restock incoming.</div>
          )}
        </div>
      </section>
    </div>
  );
}
