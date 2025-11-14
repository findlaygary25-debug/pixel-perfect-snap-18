-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'comment', 'like')),
  message text NOT NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_username text NOT NULL,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

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
    follower_username,
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Trigger for follow notifications
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

-- Trigger for comment notifications
CREATE TRIGGER on_comment_create_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();