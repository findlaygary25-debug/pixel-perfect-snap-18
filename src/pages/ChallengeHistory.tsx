import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Calendar, 
  Gift, 
  Sparkles,
  CheckCircle2,
  Star,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type ChallengeHistory = {
  challenge_id: string;
  challenge_title: string;
  challenge_description: string;
  challenge_type: string;
  target_value: number;
  current_progress: number;
  tier: string;
  reward_type: string;
  reward_value: string;
  week_start: string;
  week_end: string;
  completed_at: string;
  reward_claimed: boolean;
};

type ChallengeStats = {
  total_challenges_completed: number;
  total_rewards_earned: number;
  total_points_earned: number;
  badges_earned: number;
  current_week_completions: number;
  best_week_completions: number;
  completion_rate: number;
};

export default function ChallengeHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ChallengeHistory[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<{ week: string; completions: number }[]>([]);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);

      // Fetch challenge history
      const { data: historyData, error: historyError } = await supabase
        .from('challenge_history_view')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('completed_at', { ascending: false });

      if (historyError) throw historyError;

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_user_challenge_stats');

      if (statsError) throw statsError;

      setHistory(historyData || []);
      setStats(statsData?.[0] || null);

      // Calculate weekly completion data
      if (historyData) {
        const weeklyMap = new Map<string, number>();
        
        historyData.forEach((challenge) => {
          const weekKey = format(new Date(challenge.week_start), 'MMM dd');
          weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
        });

        const chartData = Array.from(weeklyMap.entries())
          .map(([week, completions]) => ({ week, completions }))
          .slice(-8)
          .reverse();

        setWeeklyData(chartData);
      }
    } catch (error) {
      console.error("Error fetching challenge history:", error);
    } finally {
      setLoading(false);
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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="h-4 w-4" />;
      case 'silver': return <Star className="h-4 w-4" />;
      case 'gold': return <Trophy className="h-4 w-4" />;
      case 'platinum': return <Sparkles className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const groupByWeek = (challenges: ChallengeHistory[]) => {
    const grouped = new Map<string, ChallengeHistory[]>();
    
    challenges.forEach((challenge) => {
      const weekKey = `${challenge.week_start}_${challenge.week_end}`;
      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, []);
      }
      grouped.get(weekKey)!.push(challenge);
    });

    return Array.from(grouped.entries()).map(([key, challenges]) => ({
      weekStart: challenges[0].week_start,
      weekEnd: challenges[0].week_end,
      challenges
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const weeklyGroups = groupByWeek(history);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Challenge History
            </h1>
            <p className="text-muted-foreground mt-1">
              Your achievements and completed challenges
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_challenges_completed}</div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_points_earned}</div>
              <div className="text-xs text-muted-foreground mt-1">Points Earned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.badges_earned}</div>
              <div className="text-xs text-muted-foreground mt-1">Badges Earned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.completion_rate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Completion Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.current_week_completions}</div>
              <div className="text-xs text-muted-foreground mt-1">This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.best_week_completions}</div>
              <div className="text-xs text-muted-foreground mt-1">Best Week</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Performance Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Performance
            </CardTitle>
            <CardDescription>Challenge completions over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completions" radius={[8, 8, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Challenge History by Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Completed Challenges
          </CardTitle>
          <CardDescription>All your completed challenges organized by week</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {weeklyGroups.length > 0 ? (
              <div className="space-y-6">
                {weeklyGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-3">
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {format(new Date(group.weekStart), 'MMM dd')} - {format(new Date(group.weekEnd), 'MMM dd, yyyy')}
                      </span>
                      <Badge variant="secondary">{group.challenges.length} completed</Badge>
                    </div>

                    <div className="space-y-2 pl-6">
                      {group.challenges.map((challenge) => (
                        <Card key={challenge.challenge_id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    {getTierIcon(challenge.tier)}
                                    {challenge.challenge_title}
                                  </h4>
                                  <Badge className={getTierColor(challenge.tier)}>
                                    {challenge.tier}
                                  </Badge>
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {challenge.challenge_description}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    Progress: {challenge.current_progress}/{challenge.target_value}
                                  </span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">
                                    Completed: {format(new Date(challenge.completed_at), 'MMM dd, h:mm a')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                {challenge.reward_type === 'badge' ? (
                                  <Badge variant="outline" className="gap-1">
                                    <Trophy className="h-3 w-3" />
                                    Badge
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {challenge.reward_value} pts
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {groupIndex < weeklyGroups.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Completed Challenges Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start completing weekly challenges to see your history here!
                </p>
                <Button onClick={() => navigate('/feed')}>
                  View Current Challenges
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}