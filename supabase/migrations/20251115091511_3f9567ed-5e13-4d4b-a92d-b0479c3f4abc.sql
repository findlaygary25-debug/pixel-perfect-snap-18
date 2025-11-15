-- Create function to notify video owner when their video is shared
CREATE OR REPLACE FUNCTION public.notify_on_video_share()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  video_owner_id uuid;
  sharer_username text;
  platform_name text;
BEGIN
  -- Get video owner's ID
  SELECT user_id INTO video_owner_id
  FROM videos
  WHERE id = NEW.video_id;

  -- Only notify if share is not from the video owner and video owner exists
  IF video_owner_id IS NOT NULL AND video_owner_id != NEW.user_id THEN
    -- Get sharer's username from profiles
    SELECT username INTO sharer_username
    FROM profiles
    WHERE user_id = NEW.user_id;

    -- Format platform name for better readability
    platform_name := CASE NEW.platform
      WHEN 'copy_link' THEN 'copied the link'
      WHEN 'facebook' THEN 'shared on Facebook'
      WHEN 'twitter' THEN 'shared on Twitter'
      WHEN 'linkedin' THEN 'shared on LinkedIn'
      WHEN 'whatsapp' THEN 'shared on WhatsApp'
      WHEN 'tiktok' THEN 'shared on TikTok'
      WHEN 'email' THEN 'shared via Email'
      ELSE 'shared'
    END;

    -- Create notification for video owner
    INSERT INTO notifications (user_id, type, message, sender_id, sender_username, related_id)
    VALUES (
      video_owner_id,
      'share',
      COALESCE(sharer_username, 'Someone') || ' ' || platform_name || ' your video',
      NEW.user_id,
      COALESCE(sharer_username, 'Anonymous'),
      NEW.video_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger to call the function on share insert
DROP TRIGGER IF EXISTS on_video_share ON social_shares;
CREATE TRIGGER on_video_share
  AFTER INSERT ON social_shares
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_video_share();