import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { useCurrencyStore } from "@/lib/currency-store";
import { useAuth } from "@/hooks/use-auth";
import { toggleWishlist, getWishlistIds } from "@/lib/wishlist.functions";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  image_urls: string[];
  category: string;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const primary = product.image_urls[0] ?? "/products/tee-black.jpg";
  const secondary = product.image_urls[1] ?? primary;
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  
  // Reactively watch currency change
  useCurrencyStore((s) => s.currency);

  const toggleWishlistFn = useServerFn(toggleWishlist);
  const getWishlistIdsFn = useServerFn(getWishlistIds);

  const { data: wishlistIds } = useQuery({
    queryKey: ["wishlist-ids"],
    queryFn: () => getWishlistIdsFn(),
    enabled: !!user,
  });

  const isWishlisted = wishlistIds?.includes(product.id) ?? false;

  const m = useMutation({
    mutationFn: () => toggleWishlistFn({ data: { product_id: product.id } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(res.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update wishlist");
    },
  });

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save items to your wishlist");
      navigate({ to: "/auth" });
      return;
    }
    m.mutate();
  };

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <motion.img
          src={primary}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 1 }}
          whileHover={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.4 }}
        />
        <img
          src={secondary}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur text-[10px] uppercase tracking-widest">
          {product.category}
        </div>

        {/* Heart Icon Button */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur rounded-none border border-border text-foreground hover:text-accent hover:border-accent transition-colors z-10"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <motion.div whileTap={{ scale: 0.8 }}>
            <Heart
              className={cn("h-4 w-4 transition-colors", isWishlisted && "fill-accent text-accent")}
            />
          </motion.div>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide group-hover:text-accent transition-colors">
          {product.title}
        </h3>
        <span className="text-sm font-medium">{formatPrice(product.price_cents)}</span>
      </div>
    </Link>
  );
}
