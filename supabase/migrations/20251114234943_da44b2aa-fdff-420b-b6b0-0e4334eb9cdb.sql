-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Store owners can view their store orders"
ON public.orders
FOR SELECT
USING (store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
));

CREATE POLICY "Store owners can update their store orders"
ON public.orders
FOR UPDATE
USING (store_id IN (
  SELECT id FROM stores WHERE user_id = auth.uid()
));

-- RLS policies for order_items
CREATE POLICY "Customers can view items from their orders"
ON public.order_items
FOR SELECT
USING (order_id IN (
  SELECT id FROM orders WHERE customer_id = auth.uid()
));

CREATE POLICY "Customers can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (order_id IN (
  SELECT id FROM orders WHERE customer_id = auth.uid()
));

CREATE POLICY "Store owners can view order items"
ON public.order_items
FOR SELECT
USING (order_id IN (
  SELECT orders.id FROM orders
  JOIN stores ON orders.store_id = stores.id
  WHERE stores.user_id = auth.uid()
));

-- Create trigger for updating orders.updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();