import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { History, TrendingUp, Sparkles, Trash2, Clock, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface WatchHistoryItem {
  video_id: string;
  video_url: string;
  caption: string | null;
  username: string;
  user_id: string;
  last_watched_at: string;
  watch_count: number;
  total_watch_time: number;
  last_position_seconds: number;
  completion_rate: number;
  video_duration: number;
}

interface Analytics {
  total_videos_watched: number;
  total_watch_time_minutes: number;
  average_completion_rate: number;
  total_sessions: number;
  videos_watched_today: number;
  most_watched_creator: string | null;
}

interface RecommendedVideo {
  video_id: string;
  video_url: string;
  caption: string | null;
  username: string;
  likes: number;
  views: number;
  relevance_score: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function WatchHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to view watch history");
        navigate("/login");
        return;
      }

      // Load watch history
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_user_watch_history', { user_id_param: user.id });
      
      if (historyError) throw historyError;
      setHistory(historyData || []);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_watch_history_analytics', { user_id_param: user.id });
      
      if (analyticsError) throw analyticsError;
      if (analyticsData) {
        setAnalytics(analyticsData as unknown as Analytics);
      }

      // Load recommendations
      const { data: recsData, error: recsError } = await supabase
        .rpc('get_recommended_videos', { user_id_param: user.id });
      
      if (recsError) throw recsError;
      setRecommendations(recsData || []);

    } catch (error: any) {
      console.error("Error loading watch history:", error);
      toast.error(error.message || "Failed to load watch history");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .rpc('clear_watch_history', { user_id_param: user.id });
      
      if (error) throw error;

      setHistory([]);
      toast.success("Watch history cleared");
      loadData();
    } catch (error: any) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear watch history");
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .rpc('remove_from_watch_history', { 
          user_id_param: user.id,
          video_id_param: videoId 
        });
      
      if (error) throw error;

      setHistory(prev => prev.filter(item => item.video_id !== videoId));
      toast.success("Video removed from history");
    } catch (error: any) {
      console.error("Error removing video:", error);
      toast.error("Failed to remove video");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const watchTimeData = history.slice(0, 7).map(item => ({
    name: item.username,
    minutes: Math.floor(item.total_watch_time / 60)
  }));

  const completionData = [
    { name: 'Completed', value: Math.round((analytics?.average_completion_rate || 0) * 100) },
    { name: 'Incomplete', value: 100 - Math.round((analytics?.average_completion_rate || 0) * 100) }
  ];

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Watch History</h1>
          <p className="text-muted-foreground">Track your viewing activity and discover new content</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Watch History?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your watch history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory}>Clear History</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            For You
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No watch history yet</p>
                <p className="text-sm text-muted-foreground">Start watching videos to see them here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <Card key={item.video_id} className="group relative overflow-hidden">
                  <video
                    src={item.video_url}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => navigate(`/feed?video=${item.video_id}`)}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">
                          {item.caption || "Untitled Video"}
                        </CardTitle>
                        <CardDescription>by {item.username}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveVideo(item.video_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(item.last_watched_at).toLocaleDateString()}</span>
                    </div>
                    {item.last_position_seconds > 0 && (
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-primary" />
                        <span className="text-sm">Resume at {formatDuration(item.last_position_seconds)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Badge variant="secondary">{item.watch_count}x watched</Badge>
                      <Badge variant="outline">
                        {Math.round(item.completion_rate * 100)}% completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Videos</CardDescription>
                    <CardTitle className="text-3xl">{analytics.total_videos_watched}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Watch Time</CardDescription>
                    <CardTitle className="text-3xl">
                      {formatWatchTime(analytics.total_watch_time_minutes)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Today</CardDescription>
                    <CardTitle className="text-3xl">{analytics.videos_watched_today}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Watch Time by Creator</CardTitle>
                    <CardDescription>Top 7 creators you've watched</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={watchTimeData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="minutes" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                    <CardDescription>Average video completion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={completionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {analytics.most_watched_creator && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Creator</CardTitle>
                    <CardDescription>Your most watched creator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analytics.most_watched_creator}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No recommendations yet</p>
                <p className="text-sm text-muted-foreground">Watch more videos to get personalized recommendations</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Recommended for you</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((video) => (
                  <Card key={video.video_id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/feed?video=${video.video_id}`)}>
                    <video
                      src={video.video_url}
                      className="w-full h-48 object-cover"
                    />
                    <CardHeader>
                      <CardTitle className="text-base line-clamp-2">
                        {video.caption || "Untitled Video"}
                      </CardTitle>
                      <CardDescription>by {video.username}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{video.likes} likes</Badge>
                        <Badge variant="outline">{video.views} views</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
