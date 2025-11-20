-- Add playback position tracking to video_watch_sessions
ALTER TABLE public.video_watch_sessions
ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER DEFAULT 0;

-- Function to get user's watch history with video details
CREATE OR REPLACE FUNCTION public.get_user_watch_history(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  video_id UUID,
  video_url TEXT,
  caption TEXT,
  username TEXT,
  user_id UUID,
  last_watched_at TIMESTAMP WITH TIME ZONE,
  watch_count BIGINT,
  total_watch_time INTEGER,
  last_position_seconds INTEGER,
  completion_rate NUMERIC,
  video_duration INTEGER
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS video_id,
    v.video_url,
    v.caption,
    v.username,
    v.user_id,
    MAX(vws.updated_at) AS last_watched_at,
    COUNT(DISTINCT vws.session_id) AS watch_count,
    SUM(vws.watch_duration)::INTEGER AS total_watch_time,
    (SELECT last_position_seconds FROM video_watch_sessions 
     WHERE video_id = v.id AND viewer_id = user_id_param 
     ORDER BY updated_at DESC LIMIT 1) AS last_position_seconds,
    AVG(vws.completion_rate) AS completion_rate,
    MAX(vws.video_duration)::INTEGER AS video_duration
  FROM public.videos v
  INNER JOIN public.video_watch_sessions vws ON v.id = vws.video_id
  WHERE vws.viewer_id = user_id_param
  GROUP BY v.id, v.video_url, v.caption, v.username, v.user_id
  ORDER BY last_watched_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Function to get watch history analytics
CREATE OR REPLACE FUNCTION public.get_watch_history_analytics(user_id_param UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_videos_watched', COUNT(DISTINCT video_id),
    'total_watch_time_minutes', COALESCE(SUM(watch_duration) / 60, 0),
    'average_completion_rate', COALESCE(AVG(completion_rate), 0),
    'total_sessions', COUNT(*),
    'videos_watched_today', (
      SELECT COUNT(DISTINCT video_id) 
      FROM video_watch_sessions 
      WHERE viewer_id = user_id_param 
      AND created_at >= CURRENT_DATE
    ),
    'most_watched_creator', (
      SELECT v.username 
      FROM videos v
      INNER JOIN video_watch_sessions vws ON v.id = vws.video_id
      WHERE vws.viewer_id = user_id_param
      GROUP BY v.username
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result
  FROM video_watch_sessions
  WHERE viewer_id = user_id_param;
  
  RETURN result;
END;
$$;

-- Function to get recommended videos based on watch history
CREATE OR REPLACE FUNCTION public.get_recommended_videos(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  video_id UUID,
  video_url TEXT,
  caption TEXT,
  username TEXT,
  likes INTEGER,
  views INTEGER,
  relevance_score NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH watched_creators AS (
    SELECT DISTINCT v.username, v.user_id
    FROM videos v
    INNER JOIN video_watch_sessions vws ON v.id = vws.video_id
    WHERE vws.viewer_id = user_id_param
    AND vws.completion_rate > 0.5
  ),
  watched_videos AS (
    SELECT DISTINCT video_id
    FROM video_watch_sessions
    WHERE viewer_id = user_id_param
  )
  SELECT 
    v.id AS video_id,
    v.video_url,
    v.caption,
    v.username,
    v.likes,
    v.views,
    (
      CASE 
        WHEN wc.username IS NOT NULL THEN 2.0
        ELSE 1.0
      END * 
      (1 + LOG(GREATEST(v.views, 1)))
    ) AS relevance_score
  FROM videos v
  LEFT JOIN watched_creators wc ON v.username = wc.username
  WHERE v.is_active = true
  AND v.id NOT IN (SELECT video_id FROM watched_videos)
  ORDER BY relevance_score DESC, v.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Function to clear watch history
CREATE OR REPLACE FUNCTION public.clear_watch_history(user_id_param UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM video_watch_sessions WHERE viewer_id = user_id_param;
  DELETE FROM video_views WHERE viewer_id = user_id_param;
END;
$$;

-- Function to remove single video from history
CREATE OR REPLACE FUNCTION public.remove_from_watch_history(
  user_id_param UUID,
  video_id_param UUID
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM video_watch_sessions 
  WHERE viewer_id = user_id_param AND video_id = video_id_param;
  
  DELETE FROM video_views 
  WHERE viewer_id = user_id_param AND video_id = video_id_param;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_watch_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_watch_history_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_videos TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_watch_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_watch_history TO authenticated;