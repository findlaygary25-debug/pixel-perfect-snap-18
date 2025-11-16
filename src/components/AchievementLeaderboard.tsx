import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaderboardEntry {
  rank: number;
  anonymous_id: string;
  total_achievements: number;
  platinum_count: number;
  gold_count: number;
  silver_count: number;
  bronze_count: number;
  total_switches: number;
  longest_streak: number;
}

interface GlobalStats {
  total_users: number;
  total_achievements_unlocked: number;
  total_profile_switches: number;
  avg_achievements_per_user: number;
  top_streak: number;
}

export function AchievementLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Fetch leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
        "get_achievement_leaderboard",
        { limit_count: 100 }
      );

      if (leaderboardError) throw leaderboardError;

      // Fetch global stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_global_achievement_stats"
      );

      if (statsError) throw statsError;

      setLeaderboard(leaderboardData || []);
      setGlobalStats(statsData?.[0] || null);

      // Find current user's rank
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userIdPrefix = user.id.substring(0, 8);
        const userEntry = leaderboardData?.find((entry: LeaderboardEntry) => 
          entry.anonymous_id.includes(userIdPrefix)
        );
        setCurrentUserRank(userEntry?.rank || null);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return currentUserRank === entry.rank;
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
      {/* Global Statistics */}
      {globalStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{globalStats.total_users}</div>
              <div className="text-xs text-muted-foreground">Total Players</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{globalStats.total_achievements_unlocked}</div>
              <div className="text-xs text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{globalStats.total_profile_switches}</div>
              <div className="text-xs text-muted-foreground">Profile Switches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{globalStats.avg_achievements_per_user.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg per User</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{globalStats.top_streak}</div>
              <div className="text-xs text-muted-foreground">Top Streak</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Your Rank */}
      {currentUserRank && (
        <Card className="border-primary">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">Your Global Rank: #{currentUserRank}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Global Leaderboard
          </CardTitle>
          <CardDescription>
            Top achievers ranked by total achievements unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.anonymous_id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isCurrentUser(entry)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {entry.anonymous_id}
                          {isCurrentUser(entry) && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.total_switches} profile switches · {entry.longest_streak} day streak
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-lg font-bold">
                        {entry.total_achievements}
                      </div>
                      <div className="flex gap-1">
                        {entry.platinum_count > 0 && (
                          <Badge variant="default" className="text-xs px-1 bg-gradient-to-r from-purple-600 to-purple-400">
                            {entry.platinum_count}
                          </Badge>
                        )}
                        {entry.gold_count > 0 && (
                          <Badge variant="default" className="text-xs px-1 bg-gradient-to-r from-yellow-600 to-yellow-400">
                            {entry.gold_count}
                          </Badge>
                        )}
                        {entry.silver_count > 0 && (
                          <Badge variant="secondary" className="text-xs px-1">
                            {entry.silver_count}
                          </Badge>
                        )}
                        {entry.bronze_count > 0 && (
                          <Badge variant="outline" className="text-xs px-1">
                            {entry.bronze_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}