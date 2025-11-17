-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if a user has a specific role
-- This prevents recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin')
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin(auth.uid())
$$;

-- RLS Policies for user_roles table

-- Everyone can view all user roles (for display purposes)
CREATE POLICY "Anyone can view user roles"
ON public.user_roles
FOR SELECT
USING (true);

-- Only admins can insert new roles
CREATE POLICY "Admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Admins can revoke roles"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));

-- Create audit log for role changes
CREATE TABLE public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  action TEXT NOT NULL, -- 'granted' or 'revoked'
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS on role change audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_change_audit
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert role audit logs"
ON public.role_change_audit
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_role_audit_user_id ON public.role_change_audit(user_id);
CREATE INDEX idx_role_audit_changed_at ON public.role_change_audit(changed_at DESC);

-- Create function to grant role with audit logging
CREATE OR REPLACE FUNCTION public.grant_user_role(
  target_user_id UUID,
  target_role app_role,
  audit_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can grant roles'
    );
  END IF;

  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, target_role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the action
  INSERT INTO public.role_change_audit (user_id, role, action, changed_by, reason)
  VALUES (target_user_id, target_role, 'granted', auth.uid(), audit_reason);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role granted successfully'
  );
END;
$$;

-- Create function to revoke role with audit logging
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  target_user_id UUID,
  target_role app_role,
  audit_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can revoke roles'
    );
  END IF;

  -- Prevent revoking own admin role
  IF target_user_id = auth.uid() AND target_role = 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot revoke your own admin role'
    );
  END IF;

  -- Delete the role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;

  -- Log the action
  INSERT INTO public.role_change_audit (user_id, role, action, changed_by, reason)
  VALUES (target_user_id, target_role, 'revoked', auth.uid(), audit_reason);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role revoked successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role TO authenticated;

-- Update promotional_banners policy to require admin role
DROP POLICY IF EXISTS "Active promotional banners are viewable by everyone" ON public.promotional_banners;

CREATE POLICY "Active promotional banners are viewable by everyone"
ON public.promotional_banners
FOR SELECT
USING ((is_active = true) AND (start_date <= now()) AND (end_date >= now()));

-- Add admin policies for promotional_banners
CREATE POLICY "Admins can insert promotional banners"
ON public.promotional_banners
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update promotional banners"
ON public.promotional_banners
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete promotional banners"
ON public.promotional_banners
FOR DELETE
USING (is_admin(auth.uid()));

-- Update reward_items policies to allow admin management
DROP POLICY IF EXISTS "Reward items are viewable by everyone" ON public.reward_items;

CREATE POLICY "Reward items are viewable by everyone"
ON public.reward_items
FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage reward items"
ON public.reward_items
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));