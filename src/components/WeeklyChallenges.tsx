import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Sparkles, Star, Clock, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

type WeeklyChallenge = {
  id: string;
  week_start: string;
  week_end: string;
  challenge_type: string;
  challenge_title: string;
  challenge_description: string;
  target_value: number;
  reward_type: string;
  reward_value: string;
  tier: string;
  user_progress: number;
  is_completed: boolean;
  reward_claimed: boolean;
};

type ProfileUsageHistory = {
  timestamp: string;
  profileName: string;
};

type SettingsProfile = {
  name: string;
  usageCount: number;
};

type WeeklyChallengesProps = {
  profiles: SettingsProfile[];
  usageHistory: ProfileUsageHistory[];
  onProgressUpdate?: () => void;
};

export function WeeklyChallenges({ profiles, usageHistory, onProgressUpdate }: WeeklyChallengesProps) {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekEnds, setWeekEnds] = useState<string>("");

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    updateChallengeProgress();
  }, [usageHistory, profiles, challenges]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_current_weekly_challenges");

      if (error) throw error;

      setChallenges(data || []);
      
      if (data && data.length > 0) {
        setWeekEnds(format(new Date(data[0].week_end), "EEEE, MMM dd"));
      }
    } catch (error) {
      console.error("Error fetching weekly challenges:", error);
      toast.error("Failed to load weekly challenges");
    } finally {
      setLoading(false);
    }
  };

  const updateChallengeProgress = async () => {
    if (challenges.length === 0 || usageHistory.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = challenges[0]?.week_start;
      if (!weekStart) return;

      // Filter history for current week
      const weekHistory = usageHistory.filter(h => 
        new Date(h.timestamp) >= new Date(weekStart)
      );

      for (const challenge of challenges) {
        let progress = 0;

        switch (challenge.challenge_type) {
          case 'profile_variety':
            const uniqueProfiles = new Set(weekHistory.map(h => h.profileName));
            progress = uniqueProfiles.size;
            break;

          case 'profile_switches':
            progress = weekHistory.length;
            break;

          case 'daily_streak':
            const uniqueDays = new Set(
              weekHistory.map(h => new Date(h.timestamp).toDateString())
            );
            progress = uniqueDays.size;
            break;

          case 'profile_creation':
            const profilesCreatedThisWeek = profiles.filter(p => {
              // Assuming profiles don't have creation date, we'll count all for now
              // In a real app, you'd track profile creation dates
              return true;
            });
            progress = Math.min(profilesCreatedThisWeek.length, challenge.target_value);
            break;
        }

        // Update progress in database
        const isCompleted = progress >= challenge.target_value;
        
        await supabase
          .from('user_weekly_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challenge.id,
            current_progress: progress,
            is_completed: isCompleted,
            completed_at: isCompleted && !challenge.is_completed ? new Date().toISOString() : null,
          }, {
            onConflict: 'user_id,challenge_id'
          });

        // Show completion toast if newly completed
        if (isCompleted && !challenge.is_completed) {
          toast.success(`🎉 Challenge Complete: ${challenge.challenge_title}!`, {
            description: `You earned ${challenge.reward_type === 'points' ? challenge.reward_value + ' points' : 'a new badge'}!`
          });
        }
      }

      // Refresh challenges to get updated progress
      await fetchChallenges();
      onProgressUpdate?.();
    } catch (error) {
      console.error("Error updating challenge progress:", error);
    }
  };

  const claimReward = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_weekly_progress')
        .update({ reward_claimed: true })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);

      if (error) throw error;

      toast.success("Reward claimed successfully!");
      await fetchChallenges();
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim reward");
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400';
      case 'silver': return 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400';
      case 'gold': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'platinum': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRewardIcon = (rewardType: string) => {
    return rewardType === 'badge' ? <Trophy className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Weekly Challenges
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>Reset every Monday</span>
                <span className="text-foreground font-medium">• Ends {weekEnds}</span>
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/challenge-history')}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-primary" />
            <span>Complete challenges to earn points and exclusive badges!</span>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => {
          const progressPercentage = Math.min((challenge.user_progress / challenge.target_value) * 100, 100);
          
          return (
            <Card 
              key={challenge.id}
              className={challenge.is_completed ? 'border-primary bg-primary/5' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {challenge.challenge_title}
                      {challenge.is_completed && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {challenge.challenge_description}
                    </CardDescription>
                  </div>
                  <Badge className={getTierColor(challenge.tier)}>
                    {challenge.tier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {challenge.user_progress} / {challenge.target_value}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Reward & Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    {getRewardIcon(challenge.reward_type)}
                    <span className="text-muted-foreground">
                      {challenge.reward_type === 'points' 
                        ? `${challenge.reward_value} points`
                        : 'Exclusive Badge'
                      }
                    </span>
                  </div>
                  
                  {challenge.is_completed && !challenge.reward_claimed && (
                    <Button 
                      size="sm"
                      onClick={() => claimReward(challenge.id)}
                      className="gap-2"
                    >
                      <Gift className="h-4 w-4" />
                      Claim
                    </Button>
                  )}
                  
                  {challenge.is_completed && challenge.reward_claimed && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Claimed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No weekly challenges available right now.</p>
              <p className="text-sm mt-1">Check back next week!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}