-- Create user achievement stats table
CREATE TABLE public.user_achievement_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_achievements_unlocked INTEGER DEFAULT 0,
  total_profile_switches INTEGER DEFAULT 0,
  profiles_created INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  bronze_achievements INTEGER DEFAULT 0,
  silver_achievements INTEGER DEFAULT 0,
  gold_achievements INTEGER DEFAULT 0,
  platinum_achievements INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievement_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all stats anonymously"
ON public.user_achievement_stats
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own stats"
ON public.user_achievement_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.user_achievement_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to get anonymous leaderboard
CREATE OR REPLACE FUNCTION public.get_achievement_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  anonymous_id TEXT,
  total_achievements INTEGER,
  platinum_count INTEGER,
  gold_count INTEGER,
  silver_count INTEGER,
  bronze_count INTEGER,
  total_switches INTEGER,
  longest_streak INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY uas.total_achievements_unlocked DESC, uas.platinum_achievements DESC, uas.gold_achievements DESC) as rank,
    'User-' || SUBSTRING(uas.user_id::TEXT, 1, 8) as anonymous_id,
    uas.total_achievements_unlocked as total_achievements,
    uas.platinum_achievements as platinum_count,
    uas.gold_achievements as gold_count,
    uas.silver_achievements as silver_count,
    uas.bronze_achievements as bronze_count,
    uas.total_profile_switches as total_switches,
    uas.longest_streak_days as longest_streak
  FROM public.user_achievement_stats uas
  ORDER BY uas.total_achievements_unlocked DESC, uas.platinum_achievements DESC, uas.gold_achievements DESC
  LIMIT limit_count;
END;
$$;

-- Function to get global stats
CREATE OR REPLACE FUNCTION public.get_global_achievement_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_achievements_unlocked BIGINT,
  total_profile_switches BIGINT,
  avg_achievements_per_user NUMERIC,
  top_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COALESCE(SUM(uas.total_achievements_unlocked), 0)::BIGINT as total_achievements_unlocked,
    COALESCE(SUM(uas.total_profile_switches), 0)::BIGINT as total_profile_switches,
    COALESCE(AVG(uas.total_achievements_unlocked), 0)::NUMERIC as avg_achievements_per_user,
    COALESCE(MAX(uas.longest_streak_days), 0)::INTEGER as top_streak
  FROM public.user_achievement_stats uas;
END;
$$;