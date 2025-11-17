-- Add index for better query performance on user_weekly_progress
CREATE INDEX idx_user_weekly_progress_user_completed ON public.user_weekly_progress(user_id, is_completed, completed_at);

-- Create view for challenge history with rewards
CREATE OR REPLACE VIEW public.challenge_history_view AS
SELECT 
  uwp.user_id,
  uwp.challenge_id,
  uwp.current_progress,
  uwp.is_completed,
  uwp.completed_at,
  uwp.reward_claimed,
  wc.week_start,
  wc.week_end,
  wc.challenge_type,
  wc.challenge_title,
  wc.challenge_description,
  wc.target_value,
  wc.reward_type,
  wc.reward_value,
  wc.tier
FROM public.user_weekly_progress uwp
JOIN public.weekly_challenges wc ON uwp.challenge_id = wc.id
WHERE uwp.is_completed = true
ORDER BY uwp.completed_at DESC;

-- Grant access to the view
GRANT SELECT ON public.challenge_history_view TO authenticated;

-- Create function to get user's challenge history stats
CREATE OR REPLACE FUNCTION public.get_user_challenge_stats()
RETURNS TABLE (
  total_challenges_completed BIGINT,
  total_rewards_earned BIGINT,
  total_points_earned BIGINT,
  badges_earned BIGINT,
  current_week_completions BIGINT,
  best_week_completions BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_available BIGINT;
  user_completed BIGINT;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uwp.challenge_id)::BIGINT as total_challenges_completed,
    COUNT(DISTINCT uwp.challenge_id)::BIGINT as total_rewards_earned,
    COALESCE(SUM(CASE WHEN wc.reward_type = 'points' THEN wc.reward_value::INTEGER ELSE 0 END), 0)::BIGINT as total_points_earned,
    COUNT(DISTINCT CASE WHEN wc.reward_type = 'badge' THEN uwp.challenge_id END)::BIGINT as badges_earned,
    COUNT(DISTINCT CASE 
      WHEN wc.week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE 
      THEN uwp.challenge_id 
    END)::BIGINT as current_week_completions,
    (
      SELECT MAX(week_count)::BIGINT
      FROM (
        SELECT COUNT(*) as week_count
        FROM user_weekly_progress uwp2
        JOIN weekly_challenges wc2 ON uwp2.challenge_id = wc2.id
        WHERE uwp2.user_id = auth.uid()
          AND uwp2.is_completed = true
        GROUP BY wc2.week_start
      ) weekly_counts
    ) as best_week_completions,
    CASE 
      WHEN COUNT(DISTINCT wc.id) > 0 
      THEN ROUND((COUNT(DISTINCT uwp.challenge_id)::NUMERIC / COUNT(DISTINCT wc.id)::NUMERIC) * 100, 1)
      ELSE 0
    END as completion_rate
  FROM weekly_challenges wc
  LEFT JOIN user_weekly_progress uwp 
    ON wc.id = uwp.challenge_id 
    AND uwp.user_id = auth.uid()
    AND uwp.is_completed = true
  WHERE wc.week_end < CURRENT_DATE; -- Only past weeks
END;
$$;