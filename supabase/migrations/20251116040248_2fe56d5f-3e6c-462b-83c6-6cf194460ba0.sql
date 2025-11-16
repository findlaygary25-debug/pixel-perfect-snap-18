-- Create collections table for user playlists
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_items table for videos in collections
CREATE TABLE public.collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections"
ON public.collections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
ON public.collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.collections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections
FOR DELETE
USING (auth.uid() = user_id AND is_default = false);

-- RLS Policies for collection_items
CREATE POLICY "Users can view their own collection items"
ON public.collection_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their collections"
ON public.collection_items
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own collection items"
ON public.collection_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their collections"
ON public.collection_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default collection for existing users
CREATE OR REPLACE FUNCTION public.create_default_collection_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.collections (user_id, name, description, is_default)
  VALUES (NEW.user_id, 'Saved Videos', 'Default collection for bookmarked videos', true);
  
  RETURN NEW;
END;
$$;

-- Trigger to create default collection when profile is created
CREATE TRIGGER on_profile_created_create_collection
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_collection_for_user();

-- Migrate existing bookmarks to default collection
DO $$
DECLARE
  user_record RECORD;
  default_collection_id UUID;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM bookmarks LOOP
    -- Get or create default collection
    SELECT id INTO default_collection_id
    FROM collections
    WHERE user_id = user_record.user_id AND is_default = true
    LIMIT 1;
    
    IF default_collection_id IS NULL THEN
      INSERT INTO collections (user_id, name, description, is_default)
      VALUES (user_record.user_id, 'Saved Videos', 'Default collection for bookmarked videos', true)
      RETURNING id INTO default_collection_id;
    END IF;
    
    -- Migrate bookmarks to collection_items
    INSERT INTO collection_items (collection_id, video_id, user_id, created_at)
    SELECT 
      default_collection_id,
      b.video_id,
      b.user_id,
      b.created_at
    FROM bookmarks b
    WHERE b.user_id = user_record.user_id
    ON CONFLICT (collection_id, video_id) DO NOTHING;
  END LOOP;
END $$;