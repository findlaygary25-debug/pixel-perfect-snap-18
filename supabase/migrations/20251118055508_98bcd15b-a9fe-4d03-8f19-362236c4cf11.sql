-- Add social media and website fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.website_url IS 'User personal or business website URL';
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object containing social media platform URLs (e.g., {"instagram": "url", "tiktok": "url", "youtube": "url"})';