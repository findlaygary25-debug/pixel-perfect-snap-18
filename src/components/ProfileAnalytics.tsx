import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Award, Calendar, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, isAfter } from "date-fns";
import { ProfileAchievements } from "@/components/ProfileAchievements";
import { AchievementLeaderboard } from "@/components/AchievementLeaderboard";

type ProfileUsageHistory = {
  timestamp: string;
  profileName: string;
};

type SettingsProfile = {
  name: string;
  usageCount: number;
  tags: string[];
  usageHistory?: ProfileUsageHistory[];
};

type ProfileAnalyticsProps = {
  profiles: SettingsProfile[];
  usageHistory: ProfileUsageHistory[];
};

export function ProfileAnalytics({ profiles, usageHistory }: ProfileAnalyticsProps) {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalUsage = usageHistory.length;
    const last7Days = subDays(new Date(), 7);
    const last30Days = subDays(new Date(), 30);

    // Usage by profile
    const profileUsageMap = new Map<string, number>();
    usageHistory.forEach(entry => {
      profileUsageMap.set(entry.profileName, (profileUsageMap.get(entry.profileName) || 0) + 1);
    });

    // Recent usage (last 7 days)
    const recentUsage = usageHistory.filter(entry => 
      isAfter(new Date(entry.timestamp), last7Days)
    );

    // Daily usage for the last 7 days
    const dailyUsage = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd');
      dailyUsage.set(date, 0);
    }

    recentUsage.forEach(entry => {
      const date = format(new Date(entry.timestamp), 'MMM dd');
      if (dailyUsage.has(date)) {
        dailyUsage.set(date, (dailyUsage.get(date) || 0) + 1);
      }
    });

    const dailyData = Array.from(dailyUsage.entries()).map(([date, count]) => ({
      date,
      count
    }));

    // Most used profiles
    const mostUsed = Array.from(profileUsageMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        profile: profiles.find(p => p.name === name)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Usage trends
    const last7DaysCount = recentUsage.length;
    const last30DaysCount = usageHistory.filter(entry => 
      isAfter(new Date(entry.timestamp), last30Days)
    ).length;

    // Generate recommendations
    const recommendations = generateRecommendations(profiles, usageHistory, mostUsed);

    return {
      totalUsage,
      last7DaysCount,
      last30DaysCount,
      dailyData,
      mostUsed,
      recommendations
    };
  }, [profiles, usageHistory]);

  return (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total Switches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsage}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.last7DaysCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.last7DaysCount > 0 
                ? `${(analytics.last7DaysCount / 7).toFixed(1)} per day` 
                : 'No usage'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Most Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {analytics.mostUsed[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.mostUsed[0]?.count || 0} times
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Usage Trend</CardTitle>
          <CardDescription>Profile switches over the last week</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.last7DaysCount > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No usage data for the last 7 days
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Profiles Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Used Profiles</CardTitle>
          <CardDescription>Your top 5 profiles by usage</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.mostUsed.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.mostUsed} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analytics.mostUsed.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(var(--primary) / ${1 - index * 0.15})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No profile usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recommendations
            </CardTitle>
            <CardDescription>Insights based on your usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <Badge variant="outline" className="mt-0.5">
                    {rec.type}
                  </Badge>
                  <p className="text-sm flex-1">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      <TabsContent value="achievements" className="mt-4">
        <ProfileAchievements profiles={profiles} usageHistory={usageHistory} />
      </TabsContent>

      <TabsContent value="leaderboard" className="mt-4">
        <AchievementLeaderboard />
      </TabsContent>
    </Tabs>
  );
}

function generateRecommendations(
  profiles: SettingsProfile[],
  usageHistory: ProfileUsageHistory[],
  mostUsed: { name: string; count: number; profile?: SettingsProfile }[]
): { type: string; message: string }[] {
  const recommendations: { type: string; message: string }[] = [];

  // No usage yet
  if (usageHistory.length === 0) {
    recommendations.push({
      type: "Getting Started",
      message: "Start by creating profiles for different scenarios like Work, Gaming, or Travel to optimize your viewing experience."
    });
    return recommendations;
  }

  // Unused profiles
  const unusedProfiles = profiles.filter(p => p.usageCount === 0);
  if (unusedProfiles.length > 0) {
    recommendations.push({
      type: "Tip",
      message: `You have ${unusedProfiles.length} unused profile${unusedProfiles.length > 1 ? 's' : ''}: ${unusedProfiles.slice(0, 2).map(p => p.name).join(', ')}${unusedProfiles.length > 2 ? '...' : ''}. Consider deleting or trying them out.`
    });
  }

  // Heavy user of one profile
  if (mostUsed.length > 0 && usageHistory.length > 10) {
    const topProfile = mostUsed[0];
    const usagePercentage = (topProfile.count / usageHistory.length) * 100;
    
    if (usagePercentage > 70) {
      recommendations.push({
        type: "Insight",
        message: `You use "${topProfile.name}" ${usagePercentage.toFixed(0)}% of the time. Consider creating specialized profiles for different contexts to enhance your experience.`
      });
    }
  }

  // Suggest tag-based organization
  const profilesWithoutTags = profiles.filter(p => !p.tags || p.tags.length === 0);
  if (profilesWithoutTags.length > 2) {
    recommendations.push({
      type: "Organization",
      message: `${profilesWithoutTags.length} profiles don't have tags. Add tags to better organize and find your profiles quickly.`
    });
  }

  // Recent activity
  const last7Days = subDays(new Date(), 7);
  const recentUsage = usageHistory.filter(entry => 
    isAfter(new Date(entry.timestamp), last7Days)
  );
  
  if (recentUsage.length === 0 && usageHistory.length > 5) {
    recommendations.push({
      type: "Reminder",
      message: "You haven't used any profiles in the last 7 days. Profiles help customize your viewing experience - give them a try!"
    });
  }

  // If no specific recommendations, provide general tip
  if (recommendations.length === 0) {
    recommendations.push({
      type: "Tip",
      message: "Export your profiles to back them up or share them across devices using the Import/Export buttons."
    });
  }

  return recommendations;
}
