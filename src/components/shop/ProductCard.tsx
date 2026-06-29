import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

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

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
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
