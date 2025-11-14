-- Add tracking_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN tracking_number TEXT,
ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;