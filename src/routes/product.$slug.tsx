import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSuspenseQuery, queryOptions, useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBag, Zap, Check, Star, Trash2, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { getProductReviews, submitReview, deleteReview, canUserReviewProduct } from "@/lib/reviews.functions";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { useCurrencyStore } from "@/lib/currency-store";
import { toast } from "sonner";
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
  const { user } = useAuth();
  
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

  const existingUserReview = reviews?.find((r) => r.user_id === user?.id);

  const handleAdd = (express?: boolean) => {
    if (!user) {
      toast.error("Please sign in to add items to your bag");
      navigate({ to: "/auth" });
      return;
    }
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
              <a href="#reviews" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex text-accent">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                <span>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
              </a>
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
            <button
              onClick={() => handleAdd(false)}
              className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-foreground/90 transition"
            >
              <ShoppingBag className="h-4 w-4" /> Add to bag
            </button>
            <button
              onClick={() => handleAdd(true)}
              className="flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-4 text-sm uppercase tracking-widest font-semibold hover:bg-accent/90 transition"
            >
              <Zap className="h-4 w-4" /> Express buy
            </button>
          </div>

          <ul className="mt-8 border-t border-border pt-6 space-y-2 text-xs text-muted-foreground uppercase tracking-widest">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Free shipping above ₹2,000</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> 7-day no-questions return</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Printed in India</li>
          </ul>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="border-t border-border pt-12">
        <div className="grid md:grid-cols-[320px_1fr] gap-10">
          <div>
            <h2 className="text-display text-2xl mb-4">Customer Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <div className="text-5xl font-semibold">{avgRating.toFixed(1)}</div>
                  <div>
                    <div className="flex text-accent">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
                  </div>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-6 font-mono text-right">{star} ★</span>
                        <div className="flex-1 h-2 bg-muted overflow-hidden border border-border">
                          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 font-mono text-right text-[10px]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet for this product. Be the first to share your thoughts!</p>
            )}

            <ReviewForm
              productId={product.id}
              existingReview={existingUserReview}
              onSubmitted={() => refetchReviews()}
            />
          </div>

          <div className="space-y-4">
            {reviews?.map((r) => (
              <div key={r.id} className="border border-border p-5 bg-card space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {r.profiles?.full_name ?? "Verified Buyer"}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-accent uppercase tracking-widest font-semibold bg-accent/10 px-1.5 py-0.5 border border-accent/30">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    </div>
                    <div className="flex text-accent mt-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.body && <p className="text-sm text-muted-foreground leading-relaxed pt-1">{r.body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({
  productId,
  existingReview,
  onSubmitted,
}: {
  productId: string;
  existingReview?: { rating: number; body: string };
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setBody(existingReview.body);
    }
  }, [existingReview]);

  const canUserReviewFn = useServerFn(canUserReviewProduct);
  const submitReviewFn = useServerFn(submitReview);
  const deleteReviewFn = useServerFn(deleteReview);

  const { data: canReviewData, isLoading: checkingPurchase } = useQuery({
    queryKey: ["can-review-product", productId, user?.id],
    queryFn: () => canUserReviewFn({ data: { product_id: productId } }),
    enabled: !!user && !existingReview,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitReviewFn({ data: { product_id: productId, rating, body } }),
    onSuccess: () => {
      toast.success(existingReview ? "Review updated!" : "Review posted!");
      onSubmitted();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save review");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReviewFn({ data: { product_id: productId } }),
    onSuccess: () => {
      toast.success("Review deleted");
      setRating(5);
      setBody("");
      onSubmitted();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    },
  });

  if (!user) {
    return (
      <div className="mt-6 p-5 border border-dashed border-border text-center bg-card">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Please sign in to rate and review items you've purchased.</p>
        <Link to="/auth" className="inline-block bg-accent text-accent-foreground px-5 py-2.5 text-xs uppercase tracking-widest font-semibold">
          Sign In To Review
        </Link>
      </div>
    );
  }

  if (checkingPurchase) {
    return (
      <div className="mt-6 p-4 border border-border text-center text-xs text-muted-foreground">
        Checking purchase verification...
      </div>
    );
  }

  const canReview = Boolean(existingReview) || (canReviewData?.canReview ?? false);

  if (!canReview) {
    return (
      <div className="mt-6 p-5 border border-border text-center bg-card space-y-2">
        <div className="flex justify-center text-muted-foreground">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Verified Buyers Only</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          You can only review products you have purchased. Buy this product to share your feedback!
        </p>
      </div>
    );
  }

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <form onSubmit={handleSub} className="mt-6 border border-border p-5 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest font-semibold text-foreground">
          {existingReview ? "Edit your review" : "Rate & review this item"}
        </h3>
        {existingReview && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to delete your review?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-xs text-destructive hover:underline flex items-center gap-1 uppercase tracking-widest font-semibold disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Overall Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-6 w-6 ${
                  s <= (hoverRating ?? rating) ? "fill-accent text-accent" : "text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Your Review</label>
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share details about the fit, quality, or style..."
          className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="w-full bg-accent text-accent-foreground text-xs uppercase tracking-widest font-semibold py-3 hover:bg-accent/90 disabled:opacity-50 transition"
      >
        {submitMutation.isPending ? "Saving..." : existingReview ? "Update Review" : "Submit Review"}
      </button>
    </form>
  );
}
