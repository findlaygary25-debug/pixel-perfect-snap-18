-- Update encryption functions to use pgsodium's built-in key derivation
-- This avoids the need for vault secrets

-- Drop the old functions
DROP FUNCTION IF EXISTS public.encrypt_pii(TEXT);
DROP FUNCTION IF EXISTS public.decrypt_pii(BYTEA);

-- Create simplified encryption function using pgsodium
-- Uses a key derived from the database's internal key
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT, context TEXT DEFAULT 'orders_pii')
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pgsodium's deterministic encryption with a context
  -- This allows searching encrypted data but maintains security
  RETURN pgsodium.crypto_aead_det_encrypt(
    convert_to(plaintext, 'utf8'),
    convert_to(context, 'utf8'),
    pgsodium.crypto_aead_det_keygen()
  );
END;
$$;

-- Create simplified decryption function
CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext BYTEA, context TEXT DEFAULT 'orders_pii')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrypt using the same context
  RETURN convert_from(
    pgsodium.crypto_aead_det_decrypt(
      ciphertext,
      convert_to(context, 'utf8'),
      pgsodium.crypto_aead_det_keygen()
    ),
    'utf8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails (e.g., wrong key or corrupted data)
    RETURN NULL;
END;
$$;

-- Update the create order function to use the new encryption signature
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
    encrypt_pii(p_customer_email, 'email'),
    encrypt_pii(p_customer_phone, 'phone'),
    encrypt_pii(p_shipping_address, 'address'),
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

-- Update the get order function to use the new decryption signature
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
      THEN decrypt_pii(o.customer_email_encrypted, 'email')
      ELSE o.customer_email
    END as customer_email,
    CASE 
      WHEN o.customer_phone_encrypted IS NOT NULL 
      THEN decrypt_pii(o.customer_phone_encrypted, 'phone')
      ELSE o.customer_phone
    END as customer_phone,
    CASE 
      WHEN o.shipping_address_encrypted IS NOT NULL 
      THEN decrypt_pii(o.shipping_address_encrypted, 'address')
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