-- Create follows table
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows 
FOR SELECT 
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_followed ON public.follows(followed_id);