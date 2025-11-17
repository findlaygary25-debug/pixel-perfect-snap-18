-- Drop the existing view
DROP VIEW IF EXISTS challenge_history_view;

-- Recreate the view with security_invoker enabled
-- This ensures the view checks RLS policies using the caller's permissions
CREATE VIEW challenge_history_view
WITH (security_invoker = on)
AS
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
FROM user_weekly_progress uwp
JOIN weekly_challenges wc ON uwp.challenge_id = wc.id;

-- Since user_weekly_progress has RLS policy "Users can view their own progress"
-- with USING (auth.uid() = user_id), this view will automatically restrict
-- users to only see their own challenge history data