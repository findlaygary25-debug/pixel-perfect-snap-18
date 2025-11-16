import { useMemo } from "react";
import { Trophy, Star, Zap, Target, Flame, Award, CheckCircle2, Crown, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { subDays, isAfter, startOfDay, differenceInDays } from "date-fns";

type ProfileUsageHistory = {
  timestamp: string;
  profileName: string;
};

type SettingsProfile = {
  name: string;
  usageCount: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: any;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
};

type ProfileAchievementsProps = {
  profiles: SettingsProfile[];
  usageHistory: ProfileUsageHistory[];
};

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_profile',
    title: 'Getting Started',
    description: 'Create your first profile',
    icon: Star,
    tier: 'bronze' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      profiles.length >= 1,
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      Math.min(profiles.length, 1),
    maxProgress: 1
  },
  {
    id: 'variety_week',
    title: 'Variety Seeker',
    description: 'Use 5 different profiles in one week',
    icon: Sparkles,
    tier: 'silver' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => {
      const oneWeekAgo = subDays(new Date(), 7);
      const recentHistory = history.filter(h => isAfter(new Date(h.timestamp), oneWeekAgo));
      const uniqueProfiles = new Set(recentHistory.map(h => h.profileName));
      return uniqueProfiles.size >= 5;
    },
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => {
      const oneWeekAgo = subDays(new Date(), 7);
      const recentHistory = history.filter(h => isAfter(new Date(h.timestamp), oneWeekAgo));
      const uniqueProfiles = new Set(recentHistory.map(h => h.profileName));
      return uniqueProfiles.size;
    },
    maxProgress: 5
  },
  {
    id: 'consistent_user',
    title: 'Consistency Champion',
    description: 'Switch profiles on 7 consecutive days',
    icon: Flame,
    tier: 'gold' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => {
      if (history.length === 0) return false;
      
      const dates = history.map(h => startOfDay(new Date(h.timestamp)).getTime());
      const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
      
      let streak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const daysDiff = differenceInDays(uniqueDates[i - 1], uniqueDates[i]);
        if (daysDiff === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      
      return maxStreak >= 7;
    },
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => {
      if (history.length === 0) return 0;
      
      const dates = history.map(h => startOfDay(new Date(h.timestamp)).getTime());
      const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);
      
      let streak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const daysDiff = differenceInDays(uniqueDates[i - 1], uniqueDates[i]);
        if (daysDiff === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      
      return maxStreak;
    },
    maxProgress: 7
  },
  {
    id: 'power_user',
    title: 'Power User',
    description: 'Switch profiles 50 times',
    icon: Zap,
    tier: 'gold' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      history.length >= 50,
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      history.length,
    maxProgress: 50
  },
  {
    id: 'collector',
    title: 'Profile Collector',
    description: 'Create 10 different profiles',
    icon: Trophy,
    tier: 'silver' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      profiles.length >= 10,
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      profiles.length,
    maxProgress: 10
  },
  {
    id: 'explorer',
    title: 'Profile Explorer',
    description: 'Use every profile at least once',
    icon: Target,
    tier: 'silver' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => {
      if (profiles.length === 0) return false;
      return profiles.every(p => p.usageCount > 0);
    },
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      profiles.filter(p => p.usageCount > 0).length,
    maxProgress: (profiles: SettingsProfile[]) => Math.max(profiles.length, 1)
  },
  {
    id: 'dedicated',
    title: 'Dedicated User',
    description: 'Use a single profile 100 times',
    icon: Award,
    tier: 'platinum' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      profiles.some(p => p.usageCount >= 100),
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      Math.max(...profiles.map(p => p.usageCount), 0),
    maxProgress: 100
  },
  {
    id: 'master',
    title: 'Profile Master',
    description: 'Switch profiles 500 times total',
    icon: Crown,
    tier: 'platinum' as const,
    checkUnlocked: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      history.length >= 500,
    getProgress: (profiles: SettingsProfile[], history: ProfileUsageHistory[]) => 
      history.length,
    maxProgress: 500
  }
];

export function ProfileAchievements({ profiles, usageHistory }: ProfileAchievementsProps) {
  const achievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const maxProg = typeof def.maxProgress === 'function' 
        ? def.maxProgress(profiles) 
        : def.maxProgress;
      
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        tier: def.tier,
        unlocked: def.checkUnlocked(profiles, usageHistory),
        progress: Math.min(def.getProgress(profiles, usageHistory), maxProg),
        maxProgress: maxProg
      };
    });
  }, [profiles, usageHistory]);

  // Sync achievement stats to database
  useEffect(() => {
    const syncStatsToDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const unlockedAchievements = achievements.filter(a => a.unlocked);
        const tierCounts = {
          bronze: unlockedAchievements.filter(a => a.tier === 'bronze').length,
          silver: unlockedAchievements.filter(a => a.tier === 'silver').length,
          gold: unlockedAchievements.filter(a => a.tier === 'gold').length,
          platinum: unlockedAchievements.filter(a => a.tier === 'platinum').length,
        };

        // Calculate streak
        const sortedHistory = [...usageHistory].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        let currentStreak = 0;
        let longestStreak = 0;
        let lastDate: Date | null = null;

        sortedHistory.forEach((record) => {
          const recordDate = new Date(record.timestamp);
          recordDate.setHours(0, 0, 0, 0);

          if (!lastDate) {
            currentStreak = 1;
            lastDate = recordDate;
          } else {
            const dayDiff = Math.floor((lastDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
            if (dayDiff === 1) {
              currentStreak++;
              lastDate = recordDate;
            } else if (dayDiff > 1) {
              longestStreak = Math.max(longestStreak, currentStreak);
              currentStreak = 1;
              lastDate = recordDate;
            }
          }
        });
        longestStreak = Math.max(longestStreak, currentStreak);

        // Upsert stats
        const { error } = await supabase
          .from('user_achievement_stats')
          .upsert({
            user_id: user.id,
            total_achievements_unlocked: unlockedAchievements.length,
            total_profile_switches: usageHistory.length,
            profiles_created: profiles.length,
            current_streak_days: currentStreak,
            longest_streak_days: longestStreak,
            bronze_achievements: tierCounts.bronze,
            silver_achievements: tierCounts.silver,
            gold_achievements: tierCounts.gold,
            platinum_achievements: tierCounts.platinum,
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      } catch (error) {
        console.error("Error syncing achievement stats:", error);
      }
    };

    syncStatsToDatabase();
  }, [profiles, usageHistory, achievements]);

  const stats = useMemo(() => {
    const unlocked = achievements.filter(a => a.unlocked).length;
    const total = achievements.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    const byTier = {
      bronze: achievements.filter(a => a.tier === 'bronze' && a.unlocked).length,
      silver: achievements.filter(a => a.tier === 'silver' && a.unlocked).length,
      gold: achievements.filter(a => a.tier === 'gold' && a.unlocked).length,
      platinum: achievements.filter(a => a.tier === 'platinum' && a.unlocked).length,
    };

    return { unlocked, total, percentage, byTier };
  }, [achievements]);

  const getTierColor = (tier: string, unlocked: boolean) => {
    if (!unlocked) return "text-muted-foreground bg-muted/20";
    
    switch (tier) {
      case 'bronze':
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/30";
      case 'silver':
        return "text-slate-600 bg-slate-50 dark:bg-slate-950/30";
      case 'gold':
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
      case 'platinum':
        return "text-purple-600 bg-purple-50 dark:bg-purple-950/30";
      default:
        return "text-muted-foreground bg-muted/20";
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Achievement Progress
          </CardTitle>
          <CardDescription>
            {stats.unlocked} of {stats.total} achievements unlocked
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => (
              <div 
                key={tier}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border",
                  getTierColor(tier, stats.byTier[tier] > 0)
                )}
              >
                <span className="text-xs font-medium capitalize">{tier}</span>
                <span className="text-lg font-bold">{stats.byTier[tier]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercentage = achievement.maxProgress > 0 
            ? Math.round((achievement.progress / achievement.maxProgress) * 100)
            : 0;

          return (
            <Card
              key={achievement.id}
              className={cn(
                "transition-all duration-300",
                achievement.unlocked 
                  ? "border-primary/50 shadow-sm hover:shadow-md" 
                  : "opacity-60 hover:opacity-80"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      getTierColor(achievement.tier, achievement.unlocked)
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {achievement.title}
                      </CardTitle>
                      {achievement.unlocked && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {achievement.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize text-[10px]",
                        getTierColor(achievement.tier, achievement.unlocked)
                      )}
                    >
                      {achievement.tier}
                    </Badge>
                    <span className="text-muted-foreground">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className={cn(
                      "h-1.5",
                      achievement.unlocked && "bg-primary/20"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Motivational message */}
      {stats.unlocked < stats.total && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              🎯 Keep using profiles to unlock more achievements!
              <br />
              <span className="text-xs">
                {stats.total - stats.unlocked} more to go
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {stats.unlocked === stats.total && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Crown className="h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm font-semibold">🎉 Achievement Master!</p>
              <p className="text-xs text-muted-foreground">
                You've unlocked all achievements. Amazing work!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
