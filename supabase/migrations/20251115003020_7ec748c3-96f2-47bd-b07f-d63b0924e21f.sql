-- Add affiliate tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Add affiliate tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add index for affiliate order lookups
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- Create a function to get the affiliate chain (up to 5 levels)
CREATE OR REPLACE FUNCTION get_affiliate_chain(user_id uuid)
RETURNS TABLE (
  level integer,
  affiliate_id uuid,
  affiliate_username text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE affiliate_tree AS (
    -- Base case: direct referrer (level 1)
    SELECT 
      1 as level,
      p.referred_by as affiliate_id,
      p2.username as affiliate_username
    FROM profiles p
    LEFT JOIN profiles p2 ON p.referred_by = p2.user_id
    WHERE p.user_id = $1 AND p.referred_by IS NOT NULL
    
    UNION ALL
    
    -- Recursive case: up to level 5
    SELECT 
      at.level + 1,
      p.referred_by as affiliate_id,
      p2.username as affiliate_username
    FROM affiliate_tree at
    JOIN profiles p ON at.affiliate_id = p.user_id
    LEFT JOIN profiles p2 ON p.referred_by = p2.user_id
    WHERE at.level < 5 AND p.referred_by IS NOT NULL
  )
  SELECT * FROM affiliate_tree;
END;
$$;

-- Create commissions tracking table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  amount numeric NOT NULL CHECK (amount >= 0),
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  UNIQUE(order_id, affiliate_id, level)
);

-- Enable RLS on commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own commissions
CREATE POLICY "Users can view their own commissions"
ON commissions FOR SELECT
USING (auth.uid() = affiliate_id);

-- Create index for commission lookups
CREATE INDEX idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_commissions_status ON commissions(status);

-- Add comments for documentation
COMMENT ON COLUMN profiles.referred_by IS 'The user_id of the affiliate who referred this user';
COMMENT ON COLUMN orders.affiliate_id IS 'The user_id of the affiliate who gets credit for this order';
COMMENT ON TABLE commissions IS 'Tracks affiliate commissions for each order across all 5 levels';
COMMENT ON FUNCTION get_affiliate_chain IS 'Returns the affiliate chain up to 5 levels for commission distribution';