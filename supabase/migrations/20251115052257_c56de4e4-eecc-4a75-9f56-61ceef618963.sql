-- Create video_chapters table
CREATE TABLE public.video_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  timestamp NUMERIC NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_timestamp CHECK (timestamp >= 0)
);

-- Enable RLS
ALTER TABLE public.video_chapters ENABLE ROW LEVEL SECURITY;

-- Policies for video_chapters
CREATE POLICY "Chapters are viewable by everyone"
ON public.video_chapters
FOR SELECT
USING (
  video_id IN (
    SELECT id FROM public.videos WHERE is_active = true
  )
);

CREATE POLICY "Users can create chapters on their videos"
ON public.video_chapters
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  video_id IN (
    SELECT id FROM public.videos WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own chapters"
ON public.video_chapters
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chapters"
ON public.video_chapters
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_video_chapters_video_id ON public.video_chapters(video_id);
CREATE INDEX idx_video_chapters_timestamp ON public.video_chapters(video_id, timestamp);

-- Trigger for updated_at
CREATE TRIGGER update_video_chapters_updated_at
BEFORE UPDATE ON public.video_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();