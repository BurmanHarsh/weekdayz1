-- Migration: Add order_source and cost_cents for Profit Analytics and Multi-Channel Sales
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'app',
ADD COLUMN IF NOT EXISTS cost_cents INTEGER NOT NULL DEFAULT 0;

-- Create index for performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_source_created_at ON public.orders(order_source, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_created ON public.orders(payment_status, created_at);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
