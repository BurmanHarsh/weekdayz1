import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSuspenseQuery, queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBag, Zap, Check, Star } from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { getProductReviews, submitReview } from "@/lib/reviews.functions";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useCurrencyStore } from "@/lib/currency-store";
import { toast } from "sonner";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

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
  
  // Reactively watch currency change
  useCurrencyStore((s) => s.currency);

  const getProductReviewsFn = useServerFn(getProductReviews);

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ["product-reviews", product.id],
    queryFn: () => getProductReviewsFn({ data: { product_id: product.id } }),
  });

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 space-y-16">
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div
            className="relative aspect-[4/5] bg-muted overflow-hidden cursor-zoom-in border border-border"
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

        <div className="lg:pl-8 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">{product.category}</span>
          <h1 className="text-display text-4xl sm:text-6xl mt-2">{product.title}</h1>
          
          <div className="flex items-center gap-4 mt-4">
            <p className="text-2xl font-semibold">{formatPrice(product.price_cents)}</p>
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="flex text-accent">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`}
                    />
                  ))}
                </div>
                <span>({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          <p className="mt-6 text-muted-foreground">{product.description}</p>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-widest">Size</h3>
              <span className={`text-xs uppercase tracking-widest ${product.inventory_count < 10 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
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

      {/* Reviews Section */}
      <div className="border-t border-border pt-12">
        <div className="grid md:grid-cols-[300px_1fr] gap-10">
          <div>
            <h2 className="text-display text-2xl mb-4">Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-2">
                <div className="text-5xl font-semibold">{avgRating.toFixed(1)}</div>
                <div className="flex text-accent">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-5 w-5 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Based on {reviews.length} reviews</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet for this product. Be the first to share your thoughts!</p>
            )}

            <ReviewForm productId={product.id} onSubmitted={() => refetchReviews()} />
          </div>

          <div className="space-y-6">
            {reviews?.map((r) => (
              <div key={r.id} className="border border-border p-5 bg-card">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      {r.profiles?.full_name ?? "Anonymous"}
                    </span>
                    <div className="flex text-accent mt-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= r.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const submitReviewFn = useServerFn(submitReview);

  const m = useMutation({
    mutationFn: () => submitReviewFn({ data: { product_id: productId, rating, body } }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setBody("");
      onSubmitted();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    },
  });

  if (!user) {
    return (
      <div className="mt-8 p-4 border border-dashed border-border text-center">
        <p className="text-xs text-muted-foreground mb-3">Only verified buyers can leave a review</p>
        <Link to="/auth" className="text-xs uppercase tracking-widest text-accent font-semibold underline">
          Sign In
        </Link>
      </div>
    );
  }

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault();
    m.mutate();
  };

  return (
    <form onSubmit={handleSub} className="mt-8 border border-border p-4 bg-card space-y-4">
      <h3 className="text-xs uppercase tracking-widest font-semibold">Write a review</h3>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-0.5 hover:text-accent transition-colors"
            >
              <Star
                className={`h-5 w-5 ${
                  s <= (hoverRating ?? rating) ? "fill-accent text-accent" : "text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Comment</label>
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you think about the fit, print quality, fabric?"
          className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={m.isPending}
        className="w-full bg-foreground text-background text-xs uppercase tracking-widest font-semibold py-2.5 hover:bg-foreground/90 disabled:opacity-50 transition"
      >
        {m.isPending ? "Submitting…" : "Post review"}
      </button>
    </form>
  );
}
