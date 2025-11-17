-- Create gifts catalog table
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gift_value INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  tier TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gift transactions table
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  gift_id UUID NOT NULL REFERENCES public.gift_catalog(id),
  gift_value INTEGER NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  affiliate_commission NUMERIC(10,2) DEFAULT 0,
  affiliate_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Create gift balances table to track received gifts
CREATE TABLE IF NOT EXISTS public.gift_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_received INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gift_catalog
CREATE POLICY "Gift catalog is viewable by everyone"
  ON public.gift_catalog FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage gift catalog"
  ON public.gift_catalog FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for gift_transactions
CREATE POLICY "Users can view their own gift transactions"
  ON public.gift_transactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create gift transactions"
  ON public.gift_transactions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for gift_balances
CREATE POLICY "Users can view their own gift balance"
  ON public.gift_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift balance"
  ON public.gift_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gift balance"
  ON public.gift_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default gift catalog items
INSERT INTO public.gift_catalog (name, gift_value, price_usd, image_url, tier) VALUES
  ('Gold Lion', 100000, 999.99, '/gifts/gold-lion.jpg', 'legendary'),
  ('Silver Lion', 50000, 499.99, '/gifts/silver-lion.jpg', 'epic'),
  ('Bronze Lion', 10000, 99.99, '/gifts/bronze-lion.jpg', 'rare'),
  ('Light Blue Lion', 5000, 49.99, '/gifts/light-blue-lion.jpg', 'uncommon'),
  ('Red Lion', 2500, 24.99, '/gifts/red-lion.jpg', 'common'),
  ('Purple Lion', 1500, 14.99, '/gifts/purple-lion.jpg', 'common'),
  ('Dark Blue Lion', 1000, 9.99, '/gifts/dark-blue-lion.jpg', 'common');

-- Create function to update gift balances
CREATE OR REPLACE FUNCTION public.update_gift_balances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update sender's total sent
  INSERT INTO public.gift_balances (user_id, total_sent)
  VALUES (NEW.sender_id, NEW.gift_value)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_sent = gift_balances.total_sent + NEW.gift_value,
    updated_at = now();

  -- Update recipient's total received
  INSERT INTO public.gift_balances (user_id, total_received)
  VALUES (NEW.recipient_id, NEW.gift_value)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_received = gift_balances.total_received + NEW.gift_value,
    updated_at = now();

  -- Credit recipient's wallet with 80% of the gift value (platform keeps 20%)
  PERFORM increment_wallet_balance(NEW.recipient_id, NEW.gift_value * 0.80);

  RETURN NEW;
END;
$$;

-- Create trigger for gift transactions
CREATE TRIGGER update_gift_balances_trigger
  AFTER INSERT ON public.gift_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_balances();

-- Add indexes for performance
CREATE INDEX idx_gift_transactions_sender ON public.gift_transactions(sender_id);
CREATE INDEX idx_gift_transactions_recipient ON public.gift_transactions(recipient_id);
CREATE INDEX idx_gift_transactions_created ON public.gift_transactions(created_at DESC);
CREATE INDEX idx_gift_balances_user ON public.gift_balances(user_id);