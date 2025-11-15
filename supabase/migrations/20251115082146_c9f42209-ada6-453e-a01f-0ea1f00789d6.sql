-- Create table for tracking social media shares
CREATE TABLE public.social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  CONSTRAINT valid_platform CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'tiktok', 'email', 'copy_link'))
);

-- Enable Row Level Security
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert shares (even anonymous users for tracking)
CREATE POLICY "Anyone can insert shares"
ON public.social_shares
FOR INSERT
WITH CHECK (true);

-- Policy: Video owners can view shares of their videos
CREATE POLICY "Video owners can view shares"
ON public.social_shares
FOR SELECT
USING (
  video_id IN (
    SELECT id FROM videos WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.social_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_social_shares_video_id ON public.social_shares(video_id);
CREATE INDEX idx_social_shares_user_id ON public.social_shares(user_id);
CREATE INDEX idx_social_shares_platform ON public.social_shares(platform);
CREATE INDEX idx_social_shares_shared_at ON public.social_shares(shared_at DESC);