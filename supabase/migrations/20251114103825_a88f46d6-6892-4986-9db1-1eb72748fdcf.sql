-- Add triggers for notifications

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_username text;
BEGIN
  -- Get follower's username from profiles
  SELECT username INTO follower_username
  FROM profiles
  WHERE user_id = NEW.follower_id;

  -- Create notification for the followed user
  INSERT INTO notifications (user_id, type, message, sender_id, sender_username, related_id)
  VALUES (
    NEW.followed_id,
    'follow',
    follower_username || ' started following you',
    NEW.follower_id,
    COALESCE(follower_username, 'Someone'),
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_follow_create_notification ON follows;
CREATE TRIGGER on_follow_create_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  -- Get video owner's ID
  SELECT user_id INTO video_owner_id
  FROM videos
  WHERE id = NEW.video_id;

  -- Only notify if comment is not from the video owner
  IF video_owner_id != NEW.user_id THEN
    -- Create notification for video owner
    INSERT INTO notifications (user_id, type, message, sender_id, sender_username, related_id)
    VALUES (
      video_owner_id,
      'comment',
      NEW.username || ' commented on your video',
      NEW.user_id,
      NEW.username,
      NEW.video_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_comment_create_notification ON comments;
CREATE TRIGGER on_comment_create_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();