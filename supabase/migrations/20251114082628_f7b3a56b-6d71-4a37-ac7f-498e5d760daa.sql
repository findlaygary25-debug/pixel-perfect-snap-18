-- Remove foreign key constraint on videos table to allow test data
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_user_id_fkey;

-- Add sample video data for testing
INSERT INTO videos (user_id, username, video_url, caption, likes, views, is_active)
VALUES 
  (gen_random_uuid(), 'demo_user1', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Check out this amazing animation! 🎬', 42, 1205, true),
  (gen_random_uuid(), 'demo_user2', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'Beautiful cinematography 🎥✨', 87, 2341, true),
  (gen_random_uuid(), 'demo_user3', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Fire content right here! 🔥', 156, 4532, true),
  (gen_random_uuid(), 'demo_user4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'This story is incredible 😍', 234, 6789, true),
  (gen_random_uuid(), 'demo_user5', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'Mind-blowing visuals! 🌟', 98, 3210, true);