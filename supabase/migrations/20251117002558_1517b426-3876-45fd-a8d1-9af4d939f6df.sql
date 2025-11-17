-- Add sale/promotion columns to reward_items
ALTER TABLE public.reward_items
ADD COLUMN is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN sale_percentage INTEGER DEFAULT 0,
ADD COLUMN original_price INTEGER,
ADD COLUMN sale_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN sale_end_date TIMESTAMP WITH TIME ZONE;

-- Create promotional banners table
CREATE TABLE public.promotional_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  banner_type TEXT NOT NULL CHECK (banner_type IN ('sale', 'event', 'new_items', 'featured')),
  background_gradient TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  cta_link TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policy for promotional banners
CREATE POLICY "Active promotional banners are viewable by everyone"
ON public.promotional_banners
FOR SELECT
USING (
  is_active = true 
  AND start_date <= now() 
  AND end_date >= now()
);

-- Create function to get active sales items
CREATE OR REPLACE FUNCTION public.get_active_sales()
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  original_price INTEGER,
  sale_price INTEGER,
  sale_percentage INTEGER,
  time_remaining INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ri.id as item_id,
    ri.item_name,
    ri.original_price,
    ri.point_cost as sale_price,
    ri.sale_percentage,
    (ri.sale_end_date - now()) as time_remaining
  FROM reward_items ri
  WHERE ri.is_on_sale = true
    AND ri.sale_end_date > now()
    AND ri.is_available = true
  ORDER BY ri.sale_end_date ASC;
END;
$$;

-- Insert sample promotional banner
INSERT INTO public.promotional_banners (
  title,
  subtitle,
  description,
  banner_type,
  background_gradient,
  icon_name,
  cta_text,
  start_date,
  end_date,
  display_order
)
VALUES (
  '🔥 Flash Sale',
  'Limited Time Offer',
  'Get up to 50% off on selected items! Sale ends soon - don''t miss out!',
  'sale',
  'from-red-500 via-orange-500 to-yellow-500',
  'Zap',
  'Shop Now',
  now(),
  now() + interval '7 days',
  1
);

-- Create sample sale items (update existing items to be on sale)
UPDATE public.reward_items
SET 
  is_on_sale = true,
  sale_percentage = 30,
  original_price = point_cost,
  point_cost = CAST(point_cost * 0.7 AS INTEGER),
  sale_start_date = now(),
  sale_end_date = now() + interval '7 days'
WHERE item_name IN ('Golden Star Badge', '5 Extra Profile Slots', 'Custom Profile Themes');

UPDATE public.reward_items
SET 
  is_on_sale = true,
  sale_percentage = 50,
  original_price = point_cost,
  point_cost = CAST(point_cost * 0.5 AS INTEGER),
  sale_start_date = now(),
  sale_end_date = now() + interval '3 days'
WHERE item_name IN ('Lightning Bolt Badge');