-- Add recording columns to live_streams table
ALTER TABLE public.live_streams
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS recording_duration INTEGER;

-- Add index for video URL lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_video_url ON public.live_streams(video_url) WHERE video_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.live_streams.video_url IS 'URL of the recorded live stream video';
COMMENT ON COLUMN public.live_streams.recording_duration IS 'Duration of the recorded live stream in seconds';