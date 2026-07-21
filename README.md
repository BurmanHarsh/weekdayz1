# Weekdayz — Build Notes for Future AI Agents

A production-grade Gen-Z streetwear e-commerce app built on **TanStack Start + Vite + Tailwind v4 + Supabase (Lovable Cloud) + Framer Motion**.

## ✅ Implemented

### Stack

- TanStack Start (file-based routing, server functions)
- Tailwind v4 with custom OKLCH brand tokens (`src/styles.css`)
- Framer Motion (parallax, marquee, drawer, modal transitions)
- Supabase JS client (auth, DB, storage) + RLS
- Zustand persisted cart (`src/lib/cart-store.ts`)
- Sonner toasts, react-hook-form + zod for checkout, react-dropzone for uploads

### Database (Supabase)

- Enums: `app_role`, `payment_status`, `fulfillment_status`
- Tables (all with RLS): `profiles`, `user_roles`, `products`, `custom_designs`, `orders`, `order_items`
- `handle_new_user` trigger seeds profile + default `customer` role
- `has_role(uuid, app_role)` SECURITY DEFINER fn for safe role checks
- Storage buckets: **`user-graphics`** (user-isolated, admin-readable), **`product-images`** (admin write, public read)

### Routes

- `/` Landing — parallax hero, marquee, trending carousel, customization promo
- `/shop` Catalog — sidebar filters (category, size, color, price)
- `/product/$slug` PDP — image gallery + hover magnify zoom, size selector with stock indicator
- `/create` Creator Studio — drag/scale/rotate graphic on selected tee color, dynamic price, uploads to `user-graphics`
- `/cart` Full-page bag (drawer also available globally via `CartDrawer`)
- `/checkout` 3-step (shipping → review → mock payment)
- `/auth` Sign in / sign up (email + password)
- `/account` Customer order history
- `/admin` Admin-only dashboard (stats, product creator, orders queue with custom-design download links + status updater)

### Mock integrations / utilities

- **Payments** — `src/routes/checkout.tsx` simulates Stripe/Razorpay success then calls `placeOrder` server fn (marks order `paid` + `processing`). Swap the timeout block for a real intent + webhook.
- **Shipping** — `src/lib/shipping.ts` exports `calculateShippingCost(address)` and `generateTrackingId()` stubs ready for Shiprocket / FedEx / EasyPost.

---

## 🟡 Left as TODO for the next agent

These are intentionally scoped out to keep the first pass shippable. Each has a clear extension point.

1. **Admin multi-image uploader** — The product creator currently accepts comma/newline-separated image URLs. Replace `image_urls` field in `src/routes/admin.tsx` with a multi-file dropzone that uploads to the **`product-images`** bucket and stores the public URLs.
2. (Completed)**Real payment gateway** — Replace the `setTimeout` mock in `src/routes/checkout.tsx` `pay()` with Stripe PaymentIntents or Razorpay Orders. Move the `placeOrder` call into the webhook handler so orders are only created after the gateway confirms.
3. **Email transactional flows** — Order confirmation, shipped, delivered. Use Resend / Supabase Auth email templates.
4. (completed)**Inventory decrement** — On `placeOrder`, decrement `products.inventory_count` atomically (Postgres `update ... set inventory_count = inventory_count - $1 where id = $2 and inventory_count >= $1`). Currently inventory is display-only.
5. **Product PDP image gallery** — Multiple angles per product are wired in UI; seed data only has one image per product. Upload alternate angles via the new uploader (item 1) and they will render automatically.
6. (completed)**Saved custom designs** — Show a user's previous designs on `/account` with re-add-to-cart action. Table `custom_designs` already exists.
7. **Search** — Add a `/search` route or a Navbar search modal using a `text_search` index on `products.title || description`.
8. **Wishlist** — Add `wishlist` table (user_id, product_id) + heart icon on `ProductCard`.
9. **Reviews & ratings** — Add `product_reviews` table + 5-star UI on PDP.
10. **Mobile filter drawer** — Sidebar filters on `/shop` are stacked on mobile; could become a bottom-sheet modal.
11. **Real shipping API** — Implement bodies of `calculateShippingCost` / `generateTrackingId` in `src/lib/shipping.ts`. Signatures are stable, no caller changes needed.
12. **Admin role bootstrap** — There is no in-app UI to promote a user to admin. Run in SQL:
    ```sql
    insert into public.user_roles (user_id, role)
    values ('<auth.users.id>', 'admin')
    on conflict do nothing;
    ```
13. **i18n / currency switching** — Prices are paise (INR ×100). Formatter in `src/lib/format.ts` is INR-locked; parameterize for USD/EUR when needed.

---

## 🔐 Security notes

- All server functions are `createServerFn` with `requireSupabaseAuth` middleware where mutations are involved.
- Admin endpoints call `assertAdmin()` (via `has_role` RPC) — never trust client-side `isAdmin` for authorization.
- Storage paths for `user-graphics` are `${user_id}/${uuid}.{ext}` so RLS isolates uploads.
- Signed URLs for admin to view custom prints are generated server-side with 1-hour TTL.

## 🧭 Where to start

- Run the app and visit `/`. Create an account at `/auth`, then promote yourself to admin via SQL (item 12) to access `/admin`.
- Storefront content can be edited via the admin Product Creator or directly through Supabase.
