-- Create table for member affiliate recommendations
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  affiliate_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  letter text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own recommendations
CREATE POLICY "Users can manage their own recommendations"
ON public.user_recommendations
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all recommendations
CREATE POLICY "Admins can view all recommendations"
ON public.user_recommendations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to moderate recommendations
CREATE POLICY "Admins can moderate recommendations"
ON public.user_recommendations
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete recommendations"
ON public.user_recommendations
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_user_recommendations_user_id
  ON public.user_recommendations (user_id);

CREATE INDEX idx_user_recommendations_status
  ON public.user_recommendations (status);

CREATE INDEX idx_user_recommendations_letter
  ON public.user_recommendations (letter);