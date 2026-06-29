import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ShoppingBag, Zap, Check } from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const productQ = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Weekdayz` },
      { name: "description", content: "Shop the latest drop from Weekdayz." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Weekdayz` },
    ],
  }),
  loader: async ({ params, context }) => {
    try {
      await context.queryClient.ensureQueryData(productQ(params.slug));
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <div className="py-32 text-center">
      <h1 className="text-display text-5xl">Product not found</h1>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="py-32 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQ(slug));
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0]);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const addItem = useCart((s) => s.addItem);
  const navigate = useNavigate();

  const handleAdd = (express?: boolean) => {
    if (!size) {
      toast.error("Pick a size");
      return;
    }
    addItem({
      product_id: product.id,
      title: product.title,
      image: product.image_urls[0] ?? "",
      size,
      unit_price_cents: product.price_cents,
    });
    toast.success("Added to bag");
    if (express) navigate({ to: "/checkout" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid lg:grid-cols-2 gap-10">
      <div>
        <div
          className="relative aspect-[4/5] bg-muted overflow-hidden cursor-zoom-in"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
              active: true,
            });
          }}
          onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        >
          <img
            src={product.image_urls[imgIdx]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-200"
            style={{
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transform: zoom.active ? "scale(1.8)" : "scale(1)",
            }}
          />
        </div>
        {product.image_urls.length > 1 && (
          <div className="flex gap-3 mt-4">
            {product.image_urls.map((u, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`w-20 aspect-[4/5] border ${i === imgIdx ? "border-accent" : "border-border"}`}
              >
                <img src={u} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:pl-8">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">{product.category}</span>
        <h1 className="text-display text-4xl sm:text-6xl mt-2">{product.title}</h1>
        <p className="text-2xl mt-4 font-semibold">{formatPrice(product.price_cents)}</p>

        <p className="mt-6 text-muted-foreground">{product.description}</p>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest">Size</h3>
            <span className={`text-xs uppercase tracking-widest ${product.inventory_count < 10 ? "text-destructive" : "text-muted-foreground"}`}>
              {product.inventory_count < 10 ? `Only ${product.inventory_count} left` : `${product.inventory_count} in stock`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`min-w-14 py-3 text-sm font-semibold border ${
                  size === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdd(false)}
            className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90 transition"
          >
            <ShoppingBag className="h-4 w-4" /> Add to Bag
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdd(true)}
            className="inline-flex items-center justify-center gap-2 border border-foreground/30 px-6 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background transition"
          >
            <Zap className="h-4 w-4" /> Express Checkout
          </motion.button>
        </div>

        <ul className="mt-10 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Free shipping above ₹2000</li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> 7-day no-questions return</li>
          <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Printed in India</li>
        </ul>
      </div>
    </div>
  );
}
