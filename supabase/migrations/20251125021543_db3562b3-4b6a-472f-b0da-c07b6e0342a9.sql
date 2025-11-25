-- Add all flame gift items to catalog
INSERT INTO public.gift_catalog (name, gift_value, price_usd, tier, image_url, is_active)
VALUES 
  ('Flame $10', 466, 10.00, 'bronze', '/gifts/flame-10.png', true),
  ('Flame $20', 933, 20.00, 'silver', '/gifts/flame-20.png', true),
  ('Flame $30', 1400, 30.00, 'gold', '/gifts/flame-30.png', true),
  ('Flame $100', 4667, 100.00, 'platinum', '/gifts/flame-100.png', true),
  ('Flame $120', 5600, 120.00, 'platinum', '/gifts/flame-120.png', true),
  ('Flame $140', 6533, 140.00, 'platinum', '/gifts/flame-140.png', true),
  ('Flame $160', 7467, 160.00, 'platinum', '/gifts/flame-160.png', true),
  ('Flame $180', 8400, 180.00, 'diamond', '/gifts/flame-180.png', true),
  ('Flame $200', 9333, 200.00, 'diamond', '/gifts/flame-200.png', true),
  ('Flame $250', 11667, 250.00, 'diamond', '/gifts/flame-250.png', true),
  ('Flame $300', 14000, 300.00, 'diamond', '/gifts/flame-300.png', true),
  ('Flame $400', 18667, 400.00, 'legendary', '/gifts/flame-400.png', true)
ON CONFLICT DO NOTHING;