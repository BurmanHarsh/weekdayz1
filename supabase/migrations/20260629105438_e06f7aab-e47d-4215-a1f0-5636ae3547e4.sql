
-- Tighten SECURITY DEFINER function privileges
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- Storage policies: user-graphics (private)
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own graphics" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own graphics" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own graphics" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-graphics' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all graphics" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-graphics' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: product-images (private, admin write; signed URLs for everyone)
CREATE POLICY "Admins manage product images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads product images" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
