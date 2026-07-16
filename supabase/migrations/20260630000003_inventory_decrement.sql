-- Atomic inventory decrement function
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_product_id UUID,
  p_qty INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET inventory_count = inventory_count - p_qty
  WHERE id = p_product_id
    AND inventory_count >= p_qty;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', p_product_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory(UUID, INTEGER) TO service_role;
