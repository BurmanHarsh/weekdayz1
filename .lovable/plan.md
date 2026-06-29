
# Weekdayz — Full Build Plan

A bold Gen-Z streetwear store with storefront, custom design studio, cart/checkout (mock), auth, and admin panel. Built on the project's TanStack Start + Tailwind v4 + Lovable Cloud stack.

## Design Language

- **Palette**: deep black `#0A0A0A`, stark white `#FAFAFA`, toxic green accent `#C8FF00`, electric blue secondary `#3D5AFE`, muted grey for surfaces.
- **Type**: display heading = "Space Grotesk" (huge, tight tracking), body = "Inter". Loaded via @fontsource.
- **Motion**: Framer Motion for hero parallax, marquee, page transitions (fade+slide), product card hover (image swap + scale), drawer slide, modal pop.
- **Tokens**: defined in `src/styles.css` under `@theme` (semantic colors, radius, shadow-neon, gradient-toxic).

## Routes (TanStack file-based)

```text
src/routes/
  __root.tsx                  shell + nav + cart drawer + Toaster
  index.tsx                   landing (hero, marquee, trending, customizer teaser)
  shop.tsx                    catalog grid + sidebar filters
  product.$id.tsx             product detail (gallery, sizes, add-to-cart)
  create.tsx                  Creator Studio canvas
  cart.tsx                    full cart page (drawer is global)
  checkout.tsx                multi-step checkout + mock payment
  auth.tsx                    sign-in / sign-up (email + password)
  _authenticated/
    route.tsx                 (integration-managed gate)
    account.tsx               user's orders + custom designs
    admin.tsx                 admin layout (role check) + tabs
      admin.index.tsx         dashboard cards (revenue, pending)
      admin.products.tsx      product creator form + list
      admin.orders.tsx        orders queue + detail modal
```

Each public route ships unique `head()` meta (title, description, og:*).

## Components (`src/components/`)

- `layout/Navbar.tsx`, `Footer.tsx`, `MarqueeBanner.tsx`
- `home/Hero.tsx` (parallax), `TrendingCarousel.tsx`, `CustomizerTeaser.tsx`
- `shop/FilterSidebar.tsx`, `ProductCard.tsx` (hover image swap), `ProductGrid.tsx`
- `product/ImageGallery.tsx` (hover-zoom), `SizeSelector.tsx`, `StockBadge.tsx`
- `create/CreatorCanvas.tsx` (drag/scale/rotate via Framer Motion + sliders), `ColorPicker.tsx`, `PriceCalculator.tsx`, `UploadDropzone.tsx`
- `cart/CartDrawer.tsx`, `CartItem.tsx`, `CartSummary.tsx`
- `checkout/CheckoutStepper.tsx`, `ShippingForm.tsx` (zod), `PaymentMockForm.tsx`
- `admin/StatsCards.tsx`, `ProductForm.tsx` (multi-image upload), `OrdersTable.tsx`, `OrderDetailModal.tsx` (downloads design from storage), `StatusDropdown.tsx`

## State

- **Cart**: Zustand store with localStorage persistence. Items hold `productId | customDesignId`, size, qty, snapshot of price/title/thumb.
- **Auth/session**: Supabase browser client + root `onAuthStateChange`.
- **Data**: TanStack Query — `ensureQueryData` in loaders, `useSuspenseQuery` in components, `useMutation` for writes.

## Database (Lovable Cloud / Supabase)

Migration creates:

- `app_role` enum = `('customer','admin')`
- `profiles(id uuid PK → auth.users, email, full_name, created_at)` — trigger on `auth.users` insert
- `user_roles(id, user_id, role app_role, unique(user_id, role))` + `has_role(uuid, app_role)` SECURITY DEFINER
- `products(id, slug, title, description, price_cents, inventory_count, image_urls text[], sizes text[], colors text[], category, is_active, created_at)`
- `custom_designs(id, user_id, design_file_url, placement_settings jsonb, base_color, created_at)`
- `orders(id, user_id, total_cents, payment_status, fulfillment_status, shipping_details jsonb, tracking_number, created_at)` — enums for statuses
- `order_items(id, order_id, product_id nullable, custom_design_id nullable, quantity, size, unit_price_cents)`

GRANTs to `authenticated` + `service_role` per stack rules; `anon` SELECT on `products` only.

**RLS**: users read/write own profile, designs, orders, order_items; products readable by all (active only for anon); admins (`has_role`) manage products and all orders.

**Storage bucket** `user-graphics` (private). RLS: user can upload/read own folder (`auth.uid()::text = (storage.foldername(name))[1]`); admins read all.

## Creator Studio

- Canvas built with absolutely-positioned `<motion.div>` over a tee mockup PNG (generated).
- Drag = Framer `drag`; sliders control `scale`, `rotate`, `x`, `y`; color swatches recolor the tee mockup via CSS filter / SVG mockup.
- Upload PNG/JPG → Supabase storage at `user-graphics/{userId}/{uuid}.png`.
- Price = base tee + custom-print surcharge (e.g. ₹/$ +200) shown live.
- "Add Custom Tee to Cart" inserts a `custom_designs` row + adds cart item referencing it.

## Cart & Checkout (mock)

- Slide-out drawer from navbar everywhere.
- `/checkout` 3 steps: Shipping (zod-validated) → Review → Mock Payment (fake card form; "Pay" button simulates ~1.5s, sets `payment_status='paid'`, creates order + order_items via server fn, clears cart, redirects to confirmation).

## Admin Panel

- Route under `_authenticated/`; child `beforeLoad` calls a server fn that checks `has_role(userId,'admin')`, redirects otherwise.
- Dashboard: revenue (sum of paid), pending standard orders, pending custom (orders containing custom_design rows).
- Product form: multi-image upload to a `product-images` public bucket → inserts product.
- Orders queue: list + modal showing shipping JSON, items, signed-URL download for custom designs, placement settings preview, status dropdown.

## Server Functions (`src/lib/*.functions.ts`)

- `products.functions.ts`: `listProducts`, `getProduct` (public, anon publishable client)
- `cart.functions.ts`: `placeOrder` (auth)
- `designs.functions.ts`: `createDesign` (auth), signed URL getter (admin)
- `admin.functions.ts`: `getAdminStats`, `createProduct`, `updateOrderStatus`, `listOrders` — all `requireSupabaseAuth` + `has_role` check; admin-only fns load `client.server` inside the handler.
- `shipping.ts` util: `calculateShippingCost(address)` and `generateTrackingId()` stubs with TODO comments for Shiprocket/FedEx integration.

## API placeholders

Mock payment lives client-side; `placeOrder` server fn accepts `payment_intent_id` placeholder and writes `paid`. Comments mark where real Stripe/Razorpay webhook would slot in (`/api/public/webhooks/payment`).

## Seeding

Migration inserts ~8 demo products with generated hero/product imagery (Framer-motion-friendly squared images, 1024x1024) saved under `src/assets/products/`.

## Responsive & polish

- Mobile-first; navbar collapses to hamburger; filters become bottom sheet; creator canvas stacks controls below.
- Toaster (sonner) for cart/auth/checkout feedback.
- Error + notFound components on every route with a loader.
- Skeletons for product grids; suspense fallbacks.

## README.md (project root)

Documents what's complete, what's mocked (payment gateway, real shipping APIs), required env (auto via Cloud), how to extend `shipping.ts`, and admin bootstrap instructions (assign `admin` role via SQL: `insert into user_roles(user_id, role) values ('<uid>', 'admin')`).

## Implementation order in one pass

1. Install deps: `framer-motion`, `zustand`, `@fontsource/space-grotesk`, `@fontsource/inter`, `react-dropzone`.
2. Enable Lovable Cloud.
3. Migration: enums, tables, GRANTs, RLS, has_role, profile trigger, storage buckets + policies.
4. Seed products + generate hero/product/tee-mockup imagery.
5. Tokens in `src/styles.css`, font imports in `src/start.ts`.
6. Layout (Navbar, Footer, MarqueeBanner, CartDrawer) + Zustand cart.
7. Landing, Shop, Product Detail.
8. Auth page + onAuthStateChange wiring.
9. Creator Studio + storage upload.
10. Checkout + mock payment + order writing.
11. Admin (stats, products, orders).
12. README + polish pass.

