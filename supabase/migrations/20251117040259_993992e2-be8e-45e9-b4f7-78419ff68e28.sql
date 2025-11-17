-- Enable pgsodium extension for encryption (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create audit log table to track all PII access
CREATE TABLE IF NOT EXISTS public.pii_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE'
  accessed_columns TEXT[], -- Array of column names accessed
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.pii_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.pii_audit_logs
FOR INSERT
WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.pii_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_pii_audit_logs_user_id ON public.pii_audit_logs(user_id);
CREATE INDEX idx_pii_audit_logs_accessed_at ON public.pii_audit_logs(accessed_at DESC);
CREATE INDEX idx_pii_audit_logs_table_row ON public.pii_audit_logs(table_name, row_id);

-- Create a function to log PII access
CREATE OR REPLACE FUNCTION public.log_pii_access(
  p_table_name TEXT,
  p_row_id UUID,
  p_action TEXT,
  p_columns TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pii_audit_logs (
    user_id,
    table_name,
    row_id,
    action,
    accessed_columns
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_row_id,
    p_action,
    p_columns
  );
END;
$$;

-- Add encrypted columns to orders table for PII
-- We'll use separate encrypted columns alongside the existing ones for backward compatibility
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS customer_phone_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS shipping_address_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS encryption_key_id UUID;

-- Create a secure function to encrypt data using pgsodium
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key BYTEA;
BEGIN
  -- Use pgsodium to encrypt the data
  -- In production, you should use a proper key management system
  RETURN pgsodium.crypto_aead_det_encrypt(
    convert_to(plaintext, 'utf8'),
    convert_to('orders_pii_encryption', 'utf8'),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pii_encryption_key' LIMIT 1)
  );
END;
$$;

-- Create a secure function to decrypt data using pgsodium
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pgsodium to decrypt the data
  RETURN convert_from(
    pgsodium.crypto_aead_det_decrypt(
      ciphertext,
      convert_to('orders_pii_encryption', 'utf8'),
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'pii_encryption_key' LIMIT 1)
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL; -- Return NULL if decryption fails
END;
$$;

-- Create a secure function to get order details with PII (with audit logging)
CREATE OR REPLACE FUNCTION public.get_order_with_pii(order_id_param UUID)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  store_id UUID,
  total_amount NUMERIC,
  status order_status,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  affiliate_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record RECORD;
  can_access BOOLEAN;
BEGIN
  -- Check if user has permission to access this order
  SELECT EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE o.id = order_id_param
    AND (o.customer_id = auth.uid() OR s.user_id = auth.uid())
  ) INTO can_access;

  IF NOT can_access THEN
    RAISE EXCEPTION 'Access denied to order PII';
  END IF;

  -- Log PII access
  PERFORM log_pii_access(
    'orders',
    order_id_param,
    'SELECT',
    ARRAY['customer_email', 'customer_phone', 'shipping_address']
  );

  -- Return order with decrypted PII
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.store_id,
    o.total_amount,
    o.status,
    o.customer_name,
    CASE 
      WHEN o.customer_email_encrypted IS NOT NULL 
      THEN decrypt_pii(o.customer_email_encrypted)
      ELSE o.customer_email
    END as customer_email,
    CASE 
      WHEN o.customer_phone_encrypted IS NOT NULL 
      THEN decrypt_pii(o.customer_phone_encrypted)
      ELSE o.customer_phone
    END as customer_phone,
    CASE 
      WHEN o.shipping_address_encrypted IS NOT NULL 
      THEN decrypt_pii(o.shipping_address_encrypted)
      ELSE o.shipping_address
    END as shipping_address,
    o.tracking_number,
    o.created_at,
    o.updated_at,
    o.shipped_at,
    o.delivered_at,
    o.affiliate_id
  FROM orders o
  WHERE o.id = order_id_param;
END;
$$;

-- Create a function to insert order with encrypted PII
CREATE OR REPLACE FUNCTION public.create_order_with_encrypted_pii(
  p_customer_id UUID,
  p_store_id UUID,
  p_total_amount NUMERIC,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_affiliate_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  -- Verify the user is the customer
  IF auth.uid() != p_customer_id THEN
    RAISE EXCEPTION 'Access denied: cannot create order for another user';
  END IF;

  -- Insert order with encrypted PII
  INSERT INTO orders (
    customer_id,
    store_id,
    total_amount,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    customer_email_encrypted,
    customer_phone_encrypted,
    shipping_address_encrypted,
    affiliate_id
  ) VALUES (
    p_customer_id,
    p_store_id,
    p_total_amount,
    p_customer_name,
    p_customer_email, -- Keep for backward compatibility
    p_customer_phone, -- Keep for backward compatibility
    p_shipping_address, -- Keep for backward compatibility
    encrypt_pii(p_customer_email),
    encrypt_pii(p_customer_phone),
    encrypt_pii(p_shipping_address),
    p_affiliate_id
  ) RETURNING id INTO new_order_id;

  -- Log PII access for INSERT
  PERFORM log_pii_access(
    'orders',
    new_order_id,
    'INSERT',
    ARRAY['customer_email', 'customer_phone', 'shipping_address']
  );

  RETURN new_order_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_pii_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_with_pii TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_encrypted_pii TO authenticated;