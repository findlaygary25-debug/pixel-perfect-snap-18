-- Fix Critical Security Issue: Admin Bootstrap Token Exposure
-- Drop the overly permissive SELECT policy that allows any authenticated user to view all tokens

DROP POLICY IF EXISTS "Anyone can validate tokens" ON public.admin_bootstrap_tokens;

-- Invalidate any existing unused tokens as a security precaution
UPDATE public.admin_bootstrap_tokens
SET used = true,
    used_at = now()
WHERE used = false;

-- Note: Token validation now happens exclusively through the claim_admin_bootstrap() function
-- which uses SECURITY DEFINER and proper access controls