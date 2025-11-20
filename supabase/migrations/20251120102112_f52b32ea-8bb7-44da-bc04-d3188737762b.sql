-- Add account management columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_region TEXT DEFAULT 'New Zealand';

-- Create blocked_users table for managing blocked accounts
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_users
CREATE POLICY "Users can view their own blocked list"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can block other users"
ON public.blocked_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id != blocked_user_id);

CREATE POLICY "Users can unblock users"
ON public.blocked_users
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);