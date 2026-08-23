-- ============= ADD MRP (COMPARE-AT) PRICE TO PRODUCTS =============
-- Adds an optional "actual/MRP" price that is shown crossed out next to the
-- current sale price, so the catalogue can display the discount properly.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price_cents INTEGER
    CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents >= 0);

-- Backfill: any existing product without a compare-at price gets one
-- that equals its current sale price (so no strikethrough is shown for
-- legacy rows, keeping behaviour identical to before this migration).
UPDATE public.products
  SET compare_at_price_cents = price_cents
  WHERE compare_at_price_cents IS NULL;
