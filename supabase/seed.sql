-- First, clear existing sample products
DELETE FROM public.products;

-- ==================== F1 COLLECTION ====================

-- F1 General Tee
INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'F1 Racewear Graphic Tee',
  'f1-racewear-graphic-tee',
  'Rev up your wardrobe with this exclusive F1-inspired graphic tee. Lightweight, breathable fabric with bold motorsport detailing.',
  199900,
  50,
  ARRAY[
    '/weekdayzstock/F1/f1/WhatsApp Image 2026-06-29 at 17.40.01 (2).jpeg',
    '/weekdayzstock/F1/f1/WhatsApp Image 2026-06-29 at 17.40.02 (1).jpeg',
    '/weekdayzstock/F1/f1/WhatsApp Image 2026-06-29 at 17.40.02 (2).jpeg',
    '/weekdayzstock/F1/f1/WhatsApp Image 2026-06-29 at 17.40.02.jpeg',
    '/weekdayzstock/F1/f1/WhatsApp Image 2026-06-29 at 17.40.03.jpeg'
  ],
  'F1',
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Black', 'White'],
  true,
  now()
);

-- Ferrari Tee
INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Ferrari Scuderia Drop Tee',
  'ferrari-scuderia-drop-tee',
  'For the Tifosi. Premium Ferrari-edition graphic tee with iconic prancing horse artwork. A limited-edition collab drop from Weekdayz.',
  249900,
  30,
  ARRAY[
    '/weekdayzstock/F1/Ferrari/WhatsApp Image 2026-06-29 at 17.40.01 (1).jpeg',
    '/weekdayzstock/F1/Ferrari/WhatsApp Image 2026-06-29 at 17.40.01.jpeg',
    '/weekdayzstock/F1/Ferrari/WhatsApp Image 2026-06-29 at 17.40.03 (1).jpeg',
    '/weekdayzstock/F1/Ferrari/WhatsApp Image 2026-06-29 at 17.40.04.jpeg'
  ],
  'F1',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Ferrari Red', 'Black'],
  true,
  now()
);

-- Red Bull Tee
INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Red Bull Racing Pit Crew Tee',
  'redbull-pit-crew-tee',
  'Fly like Verstappen. Official-inspired Red Bull Racing tee with bold team graphics. Give it wings.',
  229900,
  40,
  ARRAY[
    '/weekdayzstock/F1/redbull/WhatsApp Image 2026-06-29 at 17.40.03 (2).jpeg',
    '/weekdayzstock/F1/redbull/WhatsApp Image 2026-06-29 at 17.40.04 (1).jpeg'
  ],
  'F1',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Navy Blue', 'Red'],
  true,
  now()
);

-- ==================== RCB COLLECTION ====================

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'RCB Fan Edition Drop Tee',
  'rcb-fan-edition-tee',
  'Ee sala cup namde! Rep the Red & Gold in style with the official Weekdayz x RCB fan edition tee. Pre-match or post-match — always dripping.',
  199900,
  60,
  ARRAY[
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.09 (1).jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.09 (2).jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.09.jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.10 (1).jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.10 (2).jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.10.jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.11 (1).jpeg',
    '/weekdayzstock/RCB/WhatsApp Image 2026-06-29 at 17.40.11.jpeg'
  ],
  'RCB',
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Red', 'Gold', 'Black'],
  true,
  now()
);

-- ==================== CASUALS COLLECTION ====================

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Weekdayz Core Casual Tee',
  'weekdayz-core-casual-tee',
  'The everyday essential. Clean silhouette, soft-washed cotton, and a relaxed boxy fit. Wear it to anything — because every day is a weekdayz.',
  149900,
  100,
  ARRAY[
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.53 (1).jpeg',
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.53 (2).jpeg',
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.53.jpeg',
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.55 (1).jpeg',
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.55 (2).jpeg',
    '/weekdayzstock/casuals/WhatsApp Image 2026-06-29 at 17.50.55.jpeg'
  ],
  'Casuals',
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['White', 'Cream', 'Black', 'Gray'],
  true,
  now()
);

-- ==================== HOODIES COLLECTION ====================

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Weekdayz Premium Oversized Hoodie',
  'weekdayz-premium-oversized-hoodie',
  '400gsm fleece hoodie with dropped shoulders, kangaroo pocket, and a relaxed oversized silhouette. Built for late nights and early drops.',
  349900,
  40,
  ARRAY[
    '/weekdayzstock/hoodies/WhatsApp Image 2026-06-29 at 17.50.54 (1).jpeg',
    '/weekdayzstock/hoodies/WhatsApp Image 2026-06-29 at 17.50.54 (2).jpeg',
    '/weekdayzstock/hoodies/WhatsApp Image 2026-06-29 at 17.50.54.jpeg'
  ],
  'Hoodies',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Black', 'Charcoal', 'Cream'],
  true,
  now()
);

-- ==================== COUPLE T-SHIRTS COLLECTION ====================

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Certified Yapper & Certified Listener Couple Tees',
  'certified-yapper-and-listener-couple-tees',
  'Celebrate your connection with matching Couple T-Shirts that are designed to turn everyday moments into lasting memories. Whether you''re heading out for a coffee date, movie night, vacation, college, anniversary, or simply spending time together, these premium oversized tees let you wear your bond with confidence and style.

Crafted from 240 GSM French Terry fabric (97% Cotton, 3% Spandex), our Couple T-Shirts offer a soft feel, breathable comfort, and a structured oversized fit that looks great on everyone. Every design is printed using premium DTF technology, delivering sharp details, vibrant colours, and long-lasting durability.

Why You''ll Love It:
• Premium 240 GSM French Terry Fabric (97% Cotton, 3% Spandex)
• Relaxed Oversized Fit
• High-Quality Premium DTF Print
• Soft, breathable, and durable
• Perfect for couples, gifting, anniversaries, birthdays, Valentine''s Day, movie dates, vacations, and everyday wear

Product Details:
• Category: Couple T-Shirts
• Fit: Oversized
• Fabric: 240 GSM French Terry (97% Cotton, 3% Spandex)
• Print: Premium DTF Print
• Sizes Available: S, M, L, XL, XXL

Wash Care:
• Wash inside out with similar colours.
• Machine wash in cold water.
• Do not bleach.
• Do not iron directly on the print.
• Hang dry for the best print life.

Match your vibe. Create memories. Wear Weekdayzz.',
  199900,
  100,
  ARRAY[
    '/products/certified-yapper-listener-couple.png',
    '/products/size-chart-oversized.png',
    '/products/certified-yapper-white.png',
    '/products/certified-listener-black.png'
  ],
  'Couple T-Shirts',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['White & Black', 'White', 'Black'],
  true,
  now()
);

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Certified Yapper Oversized Tee',
  'certified-yapper-women-oversized-tee',
  'Celebrate your connection with matching Couple T-Shirts that are designed to turn everyday moments into lasting memories. Crafted from 240 GSM French Terry fabric (97% Cotton, 3% Spandex), our Couple T-Shirts offer a soft feel, breathable comfort, and a structured oversized fit.',
  119900,
  80,
  ARRAY[
    '/products/certified-yapper-white.png',
    '/products/size-chart-oversized.png',
    '/products/certified-yapper-listener-couple.png'
  ],
  'Casuals',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['White'],
  true,
  now()
);

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Certified Listener Oversized Tee',
  'certified-listener-men-oversized-tee',
  'Celebrate your connection with matching Couple T-Shirts that are designed to turn everyday moments into lasting memories. Crafted from 240 GSM French Terry fabric (97% Cotton, 3% Spandex), our Couple T-Shirts offer a soft feel, breathable comfort, and a structured oversized fit.',
  119900,
  80,
  ARRAY[
    '/products/certified-listener-black.png',
    '/products/size-chart-oversized.png',
    '/products/certified-yapper-listener-couple.png'
  ],
  'Casuals',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Black'],
  true,
  now()
);

INSERT INTO public.products (id, title, slug, description, price_cents, inventory_count, image_urls, category, sizes, colors, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Calm Admi & Kaleshi Aurat Couple Tees',
  'calm-admi-and-kaleshi-aurat-tees',
  'Celebrate your connection with matching Calm Admi & Kaleshi Aurat Couple T-Shirts. Available in Black and White color variants. Crafted from 240 GSM French Terry fabric (97% Cotton, 3% Spandex) for breathable comfort and a structured oversized fit.',
  149800,
  100,
  ARRAY[
    '/products/calm-admi-kaleshi-aurat-black.png',
    '/products/calm-admi-kaleshi-aurat-white.png',
    '/products/size-chart-oversized.png'
  ],
  'Couple T-Shirts',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Black', 'White'],
  true,
  now()
);

