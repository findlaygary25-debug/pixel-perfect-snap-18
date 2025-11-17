-- Enable realtime for promotional_banners table
ALTER TABLE promotional_banners REPLICA IDENTITY FULL;

-- Add promotional_banners to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE promotional_banners;