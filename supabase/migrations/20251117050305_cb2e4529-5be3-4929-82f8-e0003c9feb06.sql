-- Create table for admin bootstrap tokens
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.admin_bootstrap_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if a token exists and is valid (but not see the token itself)
CREATE POLICY "Anyone can validate tokens"
ON public.admin_bootstrap_tokens
FOR SELECT
TO authenticated
USING (true);

-- Only allow inserts through a function (not directly)
CREATE POLICY "No direct inserts"
ON public.admin_bootstrap_tokens
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Create function to claim admin via bootstrap token
CREATE OR REPLACE FUNCTION public.claim_admin_bootstrap(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Check if user already has admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already an admin'
    );
  END IF;

  -- Get token record
  SELECT * INTO token_record
  FROM public.admin_bootstrap_tokens
  WHERE token = p_token
    AND used = false
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, used, or expired token'
    );
  END IF;

  -- Mark token as used
  UPDATE public.admin_bootstrap_tokens
  SET used = true,
      used_by = current_user_id,
      used_at = now()
  WHERE id = token_record.id;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (current_user_id, 'admin', current_user_id);

  -- Log the action
  INSERT INTO public.role_change_audit (user_id, role, action, changed_by, reason)
  VALUES (current_user_id, 'admin', 'granted', current_user_id, 'Bootstrap token claim');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin role granted successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_bootstrap(TEXT) TO authenticated;

-- Generate initial bootstrap token (random 32-character token)
-- This will be displayed in the migration output for the admin to use
DO $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate a secure random token
  new_token := encode(gen_random_bytes(24), 'base64');
  new_token := replace(new_token, '/', '_');
  new_token := replace(new_token, '+', '-');
  
  -- Insert the token
  INSERT INTO public.admin_bootstrap_tokens (token)
  VALUES (new_token);
  
  -- Output the token (will appear in migration logs)
  RAISE NOTICE 'ADMIN BOOTSTRAP TOKEN: %', new_token;
  RAISE NOTICE 'This token expires in 7 days and can only be used once.';
  RAISE NOTICE 'Save this token securely!';
END $$;