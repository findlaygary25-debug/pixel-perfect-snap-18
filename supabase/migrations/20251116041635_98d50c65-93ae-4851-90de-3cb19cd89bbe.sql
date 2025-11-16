-- Add cover_image_url column to collections table
ALTER TABLE collections
ADD COLUMN cover_image_url TEXT;

-- Update RLS policies to allow users to update their collection cover images
-- (already covered by existing update policy)