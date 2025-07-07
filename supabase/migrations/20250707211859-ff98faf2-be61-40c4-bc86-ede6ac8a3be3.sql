-- Add check_in_time column to orders table for customer check-ins
ALTER TABLE public.orders 
ADD COLUMN check_in_time TIMESTAMP WITH TIME ZONE;

-- Add a function to handle customer check-ins
CREATE OR REPLACE FUNCTION public.customer_check_in(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the order with check-in time
  UPDATE public.orders 
  SET check_in_time = now(),
      updated_at = now()
  WHERE id = order_id 
    AND customer_id = auth.uid()
    AND status = 'preparing';
    
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;