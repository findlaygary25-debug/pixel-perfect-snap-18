-- Create weekly challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user weekly progress table
CREATE TABLE public.user_weekly_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_challenges
CREATE POLICY "Active challenges are viewable by everyone"
ON public.weekly_challenges
FOR SELECT
USING (is_active = true);

-- RLS Policies for user_weekly_progress
CREATE POLICY "Users can view their own progress"
ON public.user_weekly_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_weekly_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_weekly_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to get current week's challenges
CREATE OR REPLACE FUNCTION public.get_current_weekly_challenges()
RETURNS TABLE (
  id UUID,
  week_start DATE,
  week_end DATE,
  challenge_type TEXT,
  challenge_title TEXT,
  challenge_description TEXT,
  target_value INTEGER,
  reward_type TEXT,
  reward_value TEXT,
  tier TEXT,
  user_progress INTEGER,
  is_completed BOOLEAN,
  reward_claimed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.week_start,
    wc.week_end,
    wc.challenge_type,
    wc.challenge_title,
    wc.challenge_description,
    wc.target_value,
    wc.reward_type,
    wc.reward_value,
    wc.tier,
    COALESCE(uwp.current_progress, 0) as user_progress,
    COALESCE(uwp.is_completed, false) as is_completed,
    COALESCE(uwp.reward_claimed, false) as reward_claimed
  FROM public.weekly_challenges wc
  LEFT JOIN public.user_weekly_progress uwp 
    ON wc.id = uwp.challenge_id 
    AND uwp.user_id = auth.uid()
  WHERE wc.is_active = true
    AND wc.week_start <= CURRENT_DATE
    AND wc.week_end >= CURRENT_DATE
  ORDER BY wc.tier DESC, wc.target_value ASC;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_weekly_progress_updated_at
BEFORE UPDATE ON public.user_weekly_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial weekly challenges
INSERT INTO public.weekly_challenges (week_start, week_end, challenge_type, challenge_title, challenge_description, target_value, reward_type, reward_value, tier)
VALUES 
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'profile_variety',
    'Variety Explorer',
    'Use 5 different profiles this week',
    5,
    'badge',
    'variety_explorer_bronze',
    'bronze'
  ),
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'profile_variety',
    'Profile Hopper',
    'Use 10 different profiles this week',
    10,
    'badge',
    'profile_hopper_silver',
    'silver'
  ),
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'profile_switches',
    'Active User',
    'Switch profiles 20 times this week',
    20,
    'points',
    '100',
    'bronze'
  ),
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'profile_switches',
    'Power User',
    'Switch profiles 50 times this week',
    50,
    'points',
    '250',
    'silver'
  ),
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'daily_streak',
    'Consistency Champion',
    'Switch profiles on 5 different days this week',
    5,
    'badge',
    'weekly_streak_gold',
    'gold'
  ),
  (
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    'profile_creation',
    'Profile Architect',
    'Create 3 new profiles this week',
    3,
    'points',
    '150',
    'silver'
  );