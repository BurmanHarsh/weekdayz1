-- Migration: Admin Promo Codes & Category Support Schema
-- Date: 2026-07-21

-- 1. Create promo_codes table for persistent admin coupon management
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC DEFAULT 0 CHECK (min_order_value >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active promo codes for checkout
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can manage all promo codes
CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Ensure product_categories index exists for fast category queries & dynamic suggestions
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Seed default promo code if not exists
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_value, is_active)
VALUES 
  ('WEEKDAYZ10', 'percent', 10, 999, TRUE),
  ('WELCOME500', 'fixed', 500, 2499, TRUE)
ON CONFLICT (code) DO NOTHING;
