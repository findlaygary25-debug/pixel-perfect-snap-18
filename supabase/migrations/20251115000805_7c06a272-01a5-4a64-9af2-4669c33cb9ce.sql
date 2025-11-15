-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for order_items table
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;