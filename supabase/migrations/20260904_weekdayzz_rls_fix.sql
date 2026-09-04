-- ============================================================
-- WEEKDAYZZ — Required SQL Migration
-- Run this entire script once in the Supabase SQL Editor
-- ============================================================

-- 1. GRANT admin role to all 3 admin emails (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email IN (
  'burmanharsh886@gmail.com',
  'weekdayzz01@gmail.com',
  'krishnasingh15kks@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = u.id AND ur.role = 'admin'
);

-- 2. GRANT customer role to all existing users who don't have one yet
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = u.id AND ur.role = 'customer'
)
AND u.email NOT IN (
  'burmanharsh886@gmail.com',
  'weekdayzz01@gmail.com',
  'krishnasingh15kks@gmail.com'
);

-- 3. Create or replace ensure_admin_role function (SECURITY DEFINER so anon key can't abuse it)
CREATE OR REPLACE FUNCTION public.ensure_admin_role()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IN ('burmanharsh886@gmail.com', 'weekdayzz01@gmail.com', 'krishnasingh15kks@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_admin_role() TO authenticated;

-- 4. Make sure has_role is callable by authenticated users only (not anon)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- 5. Ensure product-images bucket read is public (so product images load on all devices)
UPDATE storage.buckets SET public = true WHERE id = 'product-images';

-- 6. Drop and recreate storage policies cleanly
DROP POLICY IF EXISTS "Admins manage product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload product-images" ON storage.objects;

CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins manage product images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 7. Ensure promo_codes table RLS allows admins to manage
DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users view active promo codes" ON public.promo_codes;

CREATE POLICY "Users view active promo codes" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Ensure orders + order_items RLS is correct
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;

CREATE POLICY "Users insert own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Order items: users can see their own items (via order join), admins can see all
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;

CREATE POLICY "Users insert own order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Verify results
SELECT u.email, ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY u.email;
