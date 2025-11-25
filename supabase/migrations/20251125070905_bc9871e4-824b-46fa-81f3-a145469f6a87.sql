-- Add original source tracking fields to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS original_source_url TEXT,
ADD COLUMN IF NOT EXISTS original_created_at TIMESTAMP WITH TIME ZONE;

-- Add index for original source URL lookups
CREATE INDEX IF NOT EXISTS idx_videos_original_source ON public.videos(original_source_url) WHERE original_source_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.videos.original_source_url IS 'URL of the original source if video was imported or referenced from another platform';
COMMENT ON COLUMN public.videos.original_created_at IS 'Original creation date of the video if different from upload date';