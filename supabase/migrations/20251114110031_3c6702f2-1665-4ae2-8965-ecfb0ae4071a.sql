-- Enable realtime for videos table
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;

-- Enable realtime for comments table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;