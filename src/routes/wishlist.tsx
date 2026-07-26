import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { myWishlist, toggleWishlist } from "@/lib/wishlist.functions";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Weekdayz" },
      { name: "description", content: "Products you've saved to buy later." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const myWishlistFn = useServerFn(myWishlist);
  const toggleWishlistFn = useServerFn(toggleWishlist);
  const addItem = useCart((s) => s.addItem);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => myWishlistFn(),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: string) => toggleWishlistFn({ data: { product_id: productId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      toast.success("Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-display text-4xl mt-4">Save your favorites.</h1>
        <p className="mt-2 text-muted-foreground">Sign in to save items to your wishlist.</p>
        <Link
          to="/auth"
          className="mt-8 inline-block bg-accent text-accent-foreground px-8 py-4 text-xs font-bold uppercase tracking-widest font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Loading your wishlist...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Heart className="mx-auto h-12 w-12 text-accent" />
        <h1 className="text-display text-4xl mt-4">Your wishlist is empty.</h1>
        <p className="mt-2 text-muted-foreground">Tap the heart on any product to save it here.</p>
        <Link
          to="/shop"
          className="mt-8 inline-block bg-accent text-accent-foreground px-8 py-4 text-xs font-bold uppercase tracking-widest font-semibold"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-accent uppercase">SAVED FOR LATER</div>
          <h1 className="text-display text-5xl mt-2">
            Wishlist <span className="text-muted-foreground text-xl font-normal">({items.length})</span>
          </h1>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const p = item.products;
          if (!p) return null;
          return (
            <div key={p.id} className="group relative border border-border bg-card shadow-brutal flex flex-col justify-between">
              {/* Remove button */}
              <button
                onClick={() => toggleMutation.mutate(p.id)}
                aria-label="Remove"
                className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center bg-background/80 hover:bg-background border border-border text-foreground hover:text-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <Link to="/product/$slug" params={{ slug: p.slug }} className="block flex-1">
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={p.image_urls[0] ?? "/products/tee-black.jpg"}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold uppercase tracking-wide truncate group-hover:text-accent transition-colors">
                    {p.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {p.category}
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    {formatPrice(p.price_cents)}
                  </div>
                </div>
              </Link>

              {/* Move to bag button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    addItem({
                      product_id: p.id,
                      title: p.title,
                      image: p.image_urls[0] ?? "",
                      size: "M", // Default to M size
                      unit_price_cents: p.price_cents,
                    });
                    toast.success("Added to bag (Size: M)");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 border border-border hover:border-accent hover:text-accent py-2 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Move to bag
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
