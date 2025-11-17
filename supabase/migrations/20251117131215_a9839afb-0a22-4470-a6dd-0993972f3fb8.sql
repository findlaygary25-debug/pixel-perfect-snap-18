-- Create gifts catalog table (only if not exists)
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

-- Create gift transactions table (only if not exists)
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

-- Create gift balances table (only if not exists)
CREATE TABLE IF NOT EXISTS public.gift_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_received INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Gift catalog is viewable by everyone" ON public.gift_catalog;
  DROP POLICY IF EXISTS "Admins can manage gift catalog" ON public.gift_catalog;
  DROP POLICY IF EXISTS "Users can view their own gift transactions" ON public.gift_transactions;
  DROP POLICY IF EXISTS "Users can create gift transactions" ON public.gift_transactions;
  DROP POLICY IF EXISTS "Users can view their own gift balance" ON public.gift_balances;
  DROP POLICY IF EXISTS "Users can update their own gift balance" ON public.gift_balances;
  DROP POLICY IF EXISTS "Users can insert their own gift balance" ON public.gift_balances;
END $$;

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

  -- Credit recipient's wallet with 80% of gift value (platform keeps 20%)
  PERFORM increment_wallet_balance(NEW.recipient_id, NEW.gift_value * 0.80);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists, then recreate
DROP TRIGGER IF EXISTS update_gift_balances_trigger ON public.gift_transactions;

CREATE TRIGGER update_gift_balances_trigger
  AFTER INSERT ON public.gift_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gift_balances();

-- Add indexes for performance (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_gift_transactions_sender ON public.gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_recipient ON public.gift_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_created ON public.gift_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_balances_user ON public.gift_balances(user_id);