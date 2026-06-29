import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="text-display text-3xl tracking-tighter">
            WEEKDAYZ<span className="text-accent">.</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Premium streetwear for the always-online generation. Drops every week.
            Custom prints any day.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-accent">All Drops</Link></li>
            <li><Link to="/create" className="hover:text-accent">Create Your Own</Link></li>
            <li><Link to="/account" className="hover:text-accent">Your Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Follow</h4>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="p-2 border border-border hover:bg-accent hover:text-accent-foreground transition"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Twitter" className="p-2 border border-border hover:bg-accent hover:text-accent-foreground transition"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="Youtube" className="p-2 border border-border hover:bg-accent hover:text-accent-foreground transition"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-6 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <span>© {new Date().getFullYear()} Weekdayz. All rights reserved.</span>
        <span className="uppercase tracking-widest">Built for the weekdayz.</span>
      </div>
    </footer>
  );
}
