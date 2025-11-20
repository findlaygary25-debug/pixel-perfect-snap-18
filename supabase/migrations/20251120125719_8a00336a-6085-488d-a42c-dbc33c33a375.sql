-- Add payment options to products
ALTER TABLE products
ADD COLUMN payment_method TEXT DEFAULT 'coins' CHECK (payment_method IN ('coins', 'external_link')),
ADD COLUMN external_link TEXT,
ADD COLUMN price_in_coins NUMERIC DEFAULT 0;

-- Migrate existing products to use coins with current price
UPDATE products SET price_in_coins = price WHERE price_in_coins = 0;