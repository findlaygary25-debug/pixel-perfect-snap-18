-- Add columns for multiple video quality URLs
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS video_url_360p TEXT,
ADD COLUMN IF NOT EXISTS video_url_480p TEXT,
ADD COLUMN IF NOT EXISTS video_url_720p TEXT,
ADD COLUMN IF NOT EXISTS video_url_1080p TEXT;

-- Add comment to explain the structure
COMMENT ON COLUMN videos.video_url IS 'Original/source video URL (highest quality available)';
COMMENT ON COLUMN videos.video_url_360p IS 'Low quality 360p video URL for slow connections';
COMMENT ON COLUMN videos.video_url_480p IS 'Standard quality 480p video URL';
COMMENT ON COLUMN videos.video_url_720p IS 'HD 720p video URL';
COMMENT ON COLUMN videos.video_url_1080p IS 'Full HD 1080p video URL';

-- Update existing videos to use the current video_url as 720p (assuming current videos are 720p quality)
-- This ensures backward compatibility
UPDATE videos
SET video_url_720p = video_url
WHERE video_url_720p IS NULL;