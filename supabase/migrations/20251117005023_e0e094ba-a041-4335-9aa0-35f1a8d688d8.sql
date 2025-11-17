-- Drop existing constraint and add new one with all valid types
ALTER TABLE promotional_banners 
DROP CONSTRAINT IF EXISTS promotional_banners_banner_type_check;

ALTER TABLE promotional_banners 
ADD CONSTRAINT promotional_banners_banner_type_check 
CHECK (banner_type IN ('announcement', 'promotion', 'event', 'sale', 'flash_sale'));

-- Add flash sale promotional banner (1 hour duration)
INSERT INTO promotional_banners (
  title,
  subtitle,
  description,
  banner_type,
  background_gradient,
  icon_name,
  cta_text,
  cta_link,
  start_date,
  end_date,
  display_order,
  is_active
) VALUES (
  '⚡ FLASH SALE',
  '70% OFF',
  'Lightning deal! Grab premium items at massive discounts. Hurry - only 1 hour left!',
  'flash_sale',
  'from-red-500 via-orange-500 to-yellow-500',
  'Zap',
  'Shop Flash Sale',
  '/rewards-store',
  NOW(),
  NOW() + INTERVAL '1 hour',
  1,
  true
);

-- Create a function to notify users of flash sales
CREATE OR REPLACE FUNCTION notify_flash_sale()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Create notifications for all users about the flash sale
  FOR user_record IN 
    SELECT user_id FROM profiles
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      message,
      sender_id,
      sender_username,
      is_read
    ) VALUES (
      user_record.user_id,
      'flash_sale',
      '⚡ FLASH SALE ALERT! Get 70% off on premium items for the next hour!',
      user_record.user_id,
      'Voice2Fire',
      false
    );
  END LOOP;
END;
$$;