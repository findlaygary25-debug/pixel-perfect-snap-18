-- Create scheduled_videos table
CREATE TABLE public.scheduled_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  youtube_video_id TEXT NOT NULL,
  youtube_title TEXT NOT NULL,
  youtube_description TEXT,
  youtube_thumbnail TEXT,
  youtube_channel TEXT,
  youtube_embed_url TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  published_video_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_videos_status_check CHECK (status IN ('pending', 'published', 'failed'))
);

-- Enable RLS
ALTER TABLE public.scheduled_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scheduled videos"
  ON public.scheduled_videos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled videos"
  ON public.scheduled_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled videos"
  ON public.scheduled_videos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled videos"
  ON public.scheduled_videos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for efficient querying of pending videos
CREATE INDEX idx_scheduled_videos_status_time 
  ON public.scheduled_videos(status, scheduled_time) 
  WHERE status = 'pending';

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_videos_updated_at
  BEFORE UPDATE ON public.scheduled_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();