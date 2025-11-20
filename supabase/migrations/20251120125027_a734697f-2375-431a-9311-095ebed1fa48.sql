-- Add multiple images support for products
ALTER TABLE products 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Add store lease system
ALTER TABLE stores
ADD COLUMN lease_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN daily_lease_price NUMERIC DEFAULT 10.00,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update orders to support coin payments
ALTER TABLE orders
ADD COLUMN payment_method TEXT DEFAULT 'cash',
ADD COLUMN coins_paid NUMERIC DEFAULT 0;

-- Create index for active stores
CREATE INDEX idx_stores_active ON stores(is_active, lease_expiry);

-- Create function to check store lease validity
CREATE OR REPLACE FUNCTION check_store_lease_valid(store_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stores 
    WHERE id = store_id_param 
    AND is_active = true 
    AND (lease_expiry IS NULL OR lease_expiry > now())
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_store_lease_valid TO authenticated;