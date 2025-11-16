import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyChallenge {
  challenge_type: string;
  challenge_title: string;
  challenge_description: string;
  target_value: number;
  reward_type: string;
  reward_value: string;
  tier: string;
}

const CHALLENGE_TEMPLATES: WeeklyChallenge[] = [
  {
    challenge_type: 'profile_variety',
    challenge_title: 'Variety Explorer',
    challenge_description: 'Use 5 different profiles this week',
    target_value: 5,
    reward_type: 'badge',
    reward_value: 'variety_explorer_bronze',
    tier: 'bronze'
  },
  {
    challenge_type: 'profile_variety',
    challenge_title: 'Profile Hopper',
    challenge_description: 'Use 10 different profiles this week',
    target_value: 10,
    reward_type: 'badge',
    reward_value: 'profile_hopper_silver',
    tier: 'silver'
  },
  {
    challenge_type: 'profile_switches',
    challenge_title: 'Active User',
    challenge_description: 'Switch profiles 20 times this week',
    target_value: 20,
    reward_type: 'points',
    reward_value: '100',
    tier: 'bronze'
  },
  {
    challenge_type: 'profile_switches',
    challenge_title: 'Power User',
    challenge_description: 'Switch profiles 50 times this week',
    target_value: 50,
    reward_type: 'points',
    reward_value: '250',
    tier: 'silver'
  },
  {
    challenge_type: 'profile_switches',
    challenge_title: 'Profile Master',
    challenge_description: 'Switch profiles 100 times this week',
    target_value: 100,
    reward_type: 'points',
    reward_value: '500',
    tier: 'gold'
  },
  {
    challenge_type: 'daily_streak',
    challenge_title: 'Consistency Champion',
    challenge_description: 'Switch profiles on 5 different days this week',
    target_value: 5,
    reward_type: 'badge',
    reward_value: 'weekly_streak_gold',
    tier: 'gold'
  },
  {
    challenge_type: 'daily_streak',
    challenge_title: 'Perfect Week',
    challenge_description: 'Switch profiles every day this week',
    target_value: 7,
    reward_type: 'badge',
    reward_value: 'perfect_week_platinum',
    tier: 'platinum'
  },
  {
    challenge_type: 'profile_creation',
    challenge_title: 'Profile Architect',
    challenge_description: 'Create 3 new profiles this week',
    target_value: 3,
    reward_type: 'points',
    reward_value: '150',
    tier: 'silver'
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly challenges reset...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate new week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    console.log(`New week: ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);

    // Deactivate old challenges
    const { error: deactivateError } = await supabase
      .from('weekly_challenges')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating old challenges:', deactivateError);
      throw deactivateError;
    }

    console.log('Old challenges deactivated');

    // Select random challenges (4-6 challenges per week)
    const numChallenges = Math.floor(Math.random() * 3) + 4; // 4-6 challenges
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, numChallenges);

    // Insert new challenges
    const newChallenges = selectedChallenges.map(template => ({
      week_start: startOfWeek.toISOString().split('T')[0],
      week_end: endOfWeek.toISOString().split('T')[0],
      ...template,
      is_active: true
    }));

    const { error: insertError } = await supabase
      .from('weekly_challenges')
      .insert(newChallenges);

    if (insertError) {
      console.error('Error inserting new challenges:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${newChallenges.length} new weekly challenges`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset weekly challenges. Created ${newChallenges.length} new challenges.`,
        challenges: newChallenges.map(c => c.challenge_title)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in reset-weekly-challenges:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});