-- Grant admin role to known admin email addresses
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email IN ('burmanharsh886@gmail.com', 'weekdayzz01@gmail.com', 'krishnasingh15kks@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'
  );

-- SECURITY DEFINER function to auto-grant admin role (callable by authenticated users)
-- Only grants if user email is in the approved admin list
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

-- Allow admins to manage product-images storage (INSERT, UPDATE, DELETE)
-- The existing "Admins manage product images" policy covers ALL operations
-- But let's ensure anonymous/public can read product-images (already exists in schema)

-- Allow admins to manage files in product-images at any path (not just folder-scoped)
DO $$
BEGIN
  -- Drop existing policy if it exists, then recreate
  BEGIN
    DROP POLICY IF EXISTS "Admins manage product images" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

CREATE POLICY "Admins manage product images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
