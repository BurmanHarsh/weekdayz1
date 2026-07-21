-- Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('user-graphics', 'user-graphics', false),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
