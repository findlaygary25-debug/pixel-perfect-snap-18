-- Add thumbnail support to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  duration_months integer NOT NULL CHECK (duration_months IN (1, 3, 12)),
  price_usd numeric(10, 2) NOT NULL CHECK (price_usd >= 0),
  platform_fee_percentage numeric(5, 2) NOT NULL DEFAULT 10.00,
  stripe_price_id text,
  is_active boolean DEFAULT true,
  benefits text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create creator subscriptions table
CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscriber_id, creator_id, plan_id)
);

-- Create subscription transactions table
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.creator_subscriptions(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  amount_paid numeric(10, 2) NOT NULL,
  platform_fee numeric(10, 2) NOT NULL,
  creator_earnings numeric(10, 2) NOT NULL,
  stripe_payment_intent_id text,
  stripe_payment_status text,
  payment_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Creators can manage their own plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for creator_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.creator_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create subscriptions"
ON public.creator_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can cancel their subscriptions"
ON public.creator_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = subscriber_id)
WITH CHECK (auth.uid() = subscriber_id);

-- RLS Policies for subscription_transactions
CREATE POLICY "Users can view their own transactions"
ON public.subscription_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

CREATE POLICY "System can create transactions"
ON public.subscription_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_subscription_plans_creator_id ON public.subscription_plans(creator_id);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX idx_creator_subscriptions_subscriber_id ON public.creator_subscriptions(subscriber_id);
CREATE INDEX idx_creator_subscriptions_creator_id ON public.creator_subscriptions(creator_id);
CREATE INDEX idx_creator_subscriptions_status ON public.creator_subscriptions(status);
CREATE INDEX idx_subscription_transactions_subscription_id ON public.subscription_transactions(subscription_id);
CREATE INDEX idx_subscription_transactions_creator_id ON public.subscription_transactions(creator_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER update_creator_subscriptions_updated_at
  BEFORE UPDATE ON public.creator_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();