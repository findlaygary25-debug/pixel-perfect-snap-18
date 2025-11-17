-- Create reward items catalog table
CREATE TABLE public.reward_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('profile_slot', 'badge', 'premium_feature')),
  item_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  point_cost INTEGER NOT NULL,
  icon_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  is_available BOOLEAN DEFAULT true,
  stock_limit INTEGER DEFAULT NULL, -- NULL means unlimited
  stock_remaining INTEGER DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user purchases/redemptions table
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create user inventory table (for badges and unlocks)
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_data JSONB DEFAULT '{}'::jsonb,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- Add points balance to user_achievement_stats
ALTER TABLE public.user_achievement_stats
ADD COLUMN points_balance INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_items
CREATE POLICY "Reward items are viewable by everyone"
ON public.reward_items
FOR SELECT
USING (is_available = true);

-- RLS Policies for user_purchases
CREATE POLICY "Users can view their own purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.user_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_inventory
CREATE POLICY "Users can view their own inventory"
ON public.user_inventory
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own inventory"
ON public.user_inventory
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to purchase reward item
CREATE OR REPLACE FUNCTION public.purchase_reward_item(
  reward_item_id_param UUID,
  points_to_spend INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  item_record RECORD;
  result JSONB;
BEGIN
  -- Get user's current points balance
  SELECT points_balance INTO current_balance
  FROM user_achievement_stats
  WHERE user_id = auth.uid();

  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;

  -- Get reward item details
  SELECT * INTO item_record
  FROM reward_items
  WHERE id = reward_item_id_param
    AND is_available = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reward item not found or unavailable'
    );
  END IF;

  -- Check if user has enough points
  IF current_balance < item_record.point_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'required', item_record.point_cost,
      'current', current_balance
    );
  END IF;

  -- Check stock if limited
  IF item_record.stock_limit IS NOT NULL AND 
     (item_record.stock_remaining IS NULL OR item_record.stock_remaining <= 0) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item out of stock'
    );
  END IF;

  -- Check if user already owns this item (for unique items)
  IF item_record.item_type IN ('profile_slot', 'premium_feature') THEN
    IF EXISTS (
      SELECT 1 FROM user_inventory
      WHERE user_id = auth.uid()
        AND item_type = item_record.item_type
        AND item_id = item_record.id::text
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'You already own this item'
      );
    END IF;
  END IF;

  -- Deduct points
  UPDATE user_achievement_stats
  SET points_balance = points_balance - item_record.point_cost
  WHERE user_id = auth.uid();

  -- Record purchase
  INSERT INTO user_purchases (user_id, reward_item_id, points_spent)
  VALUES (auth.uid(), reward_item_id_param, item_record.point_cost);

  -- Add to inventory
  INSERT INTO user_inventory (user_id, item_type, item_id, item_name, item_data)
  VALUES (
    auth.uid(),
    item_record.item_type,
    item_record.id::text,
    item_record.item_name,
    jsonb_build_object(
      'tier', item_record.tier,
      'icon', item_record.icon_name,
      'description', item_record.item_description
    )
  );

  -- Update stock if limited
  IF item_record.stock_limit IS NOT NULL THEN
    UPDATE reward_items
    SET stock_remaining = stock_remaining - 1
    WHERE id = reward_item_id_param;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_name', item_record.item_name,
    'points_spent', item_record.point_cost,
    'remaining_balance', current_balance - item_record.point_cost
  );
END;
$$;

-- Insert initial reward items
INSERT INTO public.reward_items (item_type, item_name, item_description, point_cost, icon_name, tier, metadata)
VALUES 
  -- Profile Slots
  (
    'profile_slot',
    '5 Extra Profile Slots',
    'Unlock 5 additional profile slots to create more customized viewing experiences',
    500,
    'Layers',
    'bronze',
    '{"slots": 5}'::jsonb
  ),
  (
    'profile_slot',
    '10 Extra Profile Slots',
    'Unlock 10 additional profile slots for maximum customization',
    900,
    'Layers',
    'silver',
    '{"slots": 10}'::jsonb
  ),
  (
    'profile_slot',
    'Unlimited Profile Slots',
    'Remove all limits on profile creation',
    2000,
    'Infinity',
    'platinum',
    '{"slots": -1}'::jsonb
  ),
  
  -- Exclusive Badges
  (
    'badge',
    'Golden Star Badge',
    'Exclusive golden star badge to show on your profile',
    300,
    'Star',
    'gold',
    '{"badge_id": "golden_star"}'::jsonb
  ),
  (
    'badge',
    'Diamond Trophy Badge',
    'Rare diamond trophy badge for elite achievers',
    750,
    'Trophy',
    'platinum',
    '{"badge_id": "diamond_trophy"}'::jsonb
  ),
  (
    'badge',
    'Lightning Bolt Badge',
    'Exclusive lightning bolt badge for speed demons',
    400,
    'Zap',
    'gold',
    '{"badge_id": "lightning_bolt"}'::jsonb
  ),
  (
    'badge',
    'Crown Badge',
    'Royal crown badge for champions',
    600,
    'Crown',
    'platinum',
    '{"badge_id": "crown"}'::jsonb
  ),
  
  -- Premium Features
  (
    'premium_feature',
    'Advanced Analytics',
    'Unlock detailed analytics and insights for all your profiles',
    1000,
    'BarChart3',
    'gold',
    '{"feature_id": "advanced_analytics"}'::jsonb
  ),
  (
    'premium_feature',
    'Custom Profile Themes',
    'Unlock the ability to customize profile colors and themes',
    800,
    'Palette',
    'silver',
    '{"feature_id": "custom_themes"}'::jsonb
  ),
  (
    'premium_feature',
    'Priority Support',
    'Get priority customer support and exclusive features',
    1500,
    'Headphones',
    'platinum',
    '{"feature_id": "priority_support"}'::jsonb
  );