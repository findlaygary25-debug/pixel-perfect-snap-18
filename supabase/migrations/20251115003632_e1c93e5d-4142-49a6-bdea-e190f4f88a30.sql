-- Create function to increment wallet balance
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  user_id uuid,
  amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update wallet balance
  INSERT INTO wallets (user_id, balance)
  VALUES (user_id, amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = wallets.balance + amount,
    updated_at = now();
END;
$$;

-- Add unique constraint on wallets user_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallets_user_id_key'
  ) THEN
    ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Update the handle_new_user function to create wallet and respect referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Get referrer from metadata if provided
  referrer_id := (new.raw_user_meta_data->>'referred_by')::uuid;
  
  -- Create profile with referrer
  INSERT INTO public.profiles (user_id, username, referred_by)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    referrer_id
  );
  
  -- Create wallet for new user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0);
  
  RETURN new;
END;
$$;