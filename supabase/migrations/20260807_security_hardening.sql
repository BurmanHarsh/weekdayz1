-- Allow authenticated users to upload user graphics to their own folder: user-graphics/{user_id}/*
CREATE POLICY "Users can upload own user graphics"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-graphics' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to view their own uploaded graphics or admins to view all graphics
CREATE POLICY "Users and admins can view user graphics"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-graphics' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR 
      public.has_role(auth.uid(), 'admin')
    )
  );

-- Allow users to delete their own uploaded graphics
CREATE POLICY "Users can delete own user graphics"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-graphics' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Product images bucket: Public SELECT, Admin INSERT/UPDATE/DELETE
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images' AND 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images' AND 
    public.has_role(auth.uid(), 'admin')
  );

-- 2. Indexes for security audit logs & rapid authorization checks
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);
