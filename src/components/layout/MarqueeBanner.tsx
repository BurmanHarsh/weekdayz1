import { motion } from "framer-motion";

export function MarqueeBanner() {
  const text = "WEEKDAYZZ DROPS NEW ARRIVALS EVERY WEEK · FREE SHIPPING OVER ₹2,000 · BUILT FOR LATE NIGHTS · ";
  return (
    <div className="overflow-hidden bg-accent text-accent-foreground border-y border-foreground/10 py-2">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="text-display text-sm sm:text-base mx-6 tracking-widest">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
