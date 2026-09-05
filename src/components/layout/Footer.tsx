import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { StorePoliciesNotice } from "@/components/shop/StorePoliciesNotice";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Weekdayzz" className="h-24 w-auto" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Premium streetwear for the always-online generation. Drops every week.
            Custom prints any day. 100% prepaid &amp; hassle-free exchange.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-accent">All Drops</Link></li>
            <li><Link to="/create" className="hover:text-accent">Create Your Own</Link></li>
            <li><Link to="/bulk-orders" className="hover:text-accent">Bulk &amp; Team Merch</Link></li>
            <li><Link to="/account" className="hover:text-accent">Your Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Help & Policy</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/refunds" className="hover:text-accent">Store Policies &amp; Exchanges</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-accent">Shipping Policy</Link></li>
            <li><Link to="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
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

      {/* Official Store Policies Table */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <StorePoliciesNotice />
      </div>

      <div className="border-t border-border py-6 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <span>© {new Date().getFullYear()} Weekdayzz. All rights reserved.</span>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-accent">Privacy</Link>
          <Link to="/terms" className="hover:text-accent">Terms</Link>
          <Link to="/refunds" className="hover:text-accent">Refunds</Link>
          <Link to="/shipping-policy" className="hover:text-accent">Shipping</Link>
        </div>
      </div>
    </footer>
  );
}
