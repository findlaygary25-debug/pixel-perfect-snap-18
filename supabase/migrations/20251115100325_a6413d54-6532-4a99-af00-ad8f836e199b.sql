-- Create live_streams table
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Policies for live_streams
CREATE POLICY "Anyone can view live streams"
  ON public.live_streams
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own live streams"
  ON public.live_streams
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own live streams"
  ON public.live_streams
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own live streams"
  ON public.live_streams
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create index for active live streams
CREATE INDEX idx_live_streams_active ON public.live_streams(is_live, started_at DESC) WHERE is_live = true;

-- Create index for user's live streams
CREATE INDEX idx_live_streams_user ON public.live_streams(user_id, created_at DESC);

-- Enable realtime for live_streams
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;