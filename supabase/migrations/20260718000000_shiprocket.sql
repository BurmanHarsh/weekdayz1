-- Add shipping attributes to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS weight_g INTEGER NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS length_cm NUMERIC NOT NULL DEFAULT 30.0,
ADD COLUMN IF NOT EXISTS width_cm NUMERIC NOT NULL DEFAULT 20.0,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC NOT NULL DEFAULT 3.0;

-- Add Shiprocket identifiers and Amazon-style estimated delivery date to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
