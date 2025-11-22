import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, ThumbsUp, Clock, Youtube, CalendarIcon, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, addDays, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
  embedUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
};

type ScheduleRecommendation = {
  dayOfWeek: string;
  hour: number;
  minute: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
};

export default function ImportVideos() {
  const [searchQuery, setSearchQuery] = useState("Christian shorts");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [schedulingVideo, setSchedulingVideo] = useState<YouTubeVideo | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");
  const [recommendations, setRecommendations] = useState<ScheduleRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();

  const searchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-youtube-shorts', {
        body: { searchQuery, maxResults: 25 }
      });

      if (error) throw error;

      setVideos(data.videos || []);
      toast({
        title: "Search complete",
        description: `Found ${data.videos?.length || 0} Christian short videos`,
      });
    } catch (error) {
      console.error('Error searching videos:', error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOptimalTimes = async () => {
    setLoadingRecommendations(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to get recommendations",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-optimal-schedule-times', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a few moments",
            variant: "destructive",
          });
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast({
            title: "AI credits exhausted",
            description: "Please add credits to your workspace",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setRecommendations(data.recommendations || []);
      setShowRecommendations(true);
      
      toast({
        title: "Recommendations ready",
        description: data.overallInsight || "AI has analyzed your engagement patterns",
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const applyRecommendation = (rec: ScheduleRecommendation) => {
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = dayMap[rec.dayOfWeek as keyof typeof dayMap];
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
    
    const targetDate = addDays(today, daysToAdd);
    setScheduleDate(targetDate);
    setScheduleTime(`${rec.hour.toString().padStart(2, '0')}:${rec.minute.toString().padStart(2, '0')}`);
    setShowRecommendations(false);
  };

  const scheduleVideo = async () => {
    if (!schedulingVideo || !scheduleDate) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to schedule videos",
        variant: "destructive",
      });
      return;
    }

    try {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const scheduledTime = setMinutes(setHours(scheduleDate, hours), minutes);

      const { error } = await supabase
        .from('scheduled_videos')
        .insert({
          user_id: user.id,
          youtube_video_id: schedulingVideo.id,
          youtube_title: schedulingVideo.title,
          youtube_description: schedulingVideo.description,
          youtube_thumbnail: schedulingVideo.thumbnail,
          youtube_channel: schedulingVideo.channelTitle,
          youtube_embed_url: schedulingVideo.embedUrl,
          scheduled_time: scheduledTime.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Video scheduled",
        description: `Will be published on ${format(scheduledTime, "PPP 'at' p")}`,
      });

      setSchedulingVideo(null);
      setScheduleDate(undefined);
      setScheduleTime("09:00");
    } catch (error) {
      console.error('Error scheduling video:', error);
      toast({
        title: "Scheduling failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const importVideo = async (video: YouTubeVideo, immediate: boolean = true) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to import videos",
        variant: "destructive",
      });
      return;
    }

    if (!immediate) {
      setSchedulingVideo(video);
      return;
    }

    // Import to staging (scheduled_videos table) instead of directly to feed
    setImporting(prev => new Set(prev).add(video.id));
    try {
      const { error } = await supabase
        .from('scheduled_videos')
        .insert({
          user_id: user.id,
          youtube_video_id: video.id,
          youtube_title: video.title,
          youtube_description: video.description,
          youtube_thumbnail: video.thumbnail,
          youtube_channel: video.channelTitle,
          youtube_embed_url: video.embedUrl,
          scheduled_time: new Date().toISOString(), // Immediate import
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Video imported!",
        description: "Go to Import Manager to convert and publish this video",
      });
    } catch (error) {
      console.error('Error importing video:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import YouTube Shorts</h1>
        <p className="text-muted-foreground mt-1">
          Search and import Christian short videos - all imports require conversion before publishing
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for Christian shorts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchVideos()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchVideos} disabled={loading}>
              <Youtube className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-2 right-2 bg-black/80">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(video.duration)}
                </Badge>
              </div>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2 text-sm">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatNumber(video.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{formatNumber(video.likeCount)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => importVideo(video, true)}
                    disabled={importing.has(video.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    {importing.has(video.id) ? 'Importing...' : 'Import for Conversion'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importVideo(video, false)}
                  >
                    <Timer className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(video.videoUrl, '_blank')}
                  >
                    <Youtube className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for Christian short videos to import to your collection</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      {schedulingVideo && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Schedule Video</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">{schedulingVideo.title}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Recommendations Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">AI-Powered Recommendations</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={getOptimalTimes}
                    disabled={loadingRecommendations}
                  >
                    {loadingRecommendations ? 'Analyzing...' : 'Get Optimal Times'}
                  </Button>
                </div>
                
                {showRecommendations && recommendations.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                      Based on your audience engagement patterns
                    </p>
                    <div className="grid gap-2">
                      {recommendations.map((rec, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyRecommendation(rec)}
                          className="text-left p-3 rounded border bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {rec.dayOfWeek} at {rec.hour.toString().padStart(2, '0')}:{rec.minute.toString().padStart(2, '0')}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {rec.reason}
                              </div>
                            </div>
                            <Badge variant={rec.confidence === 'high' ? 'default' : 'secondary'}>
                              {rec.confidence}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Time</label>
              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return ['00', '30'].map(minute => (
                      <SelectItem key={`${hour}:${minute}`} value={`${hour}:${minute}`}>
                        {`${hour}:${minute}`}
                      </SelectItem>
                    ));
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Schedule</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScheduleDate(addDays(new Date(), 1));
                    setScheduleTime("09:00");
                  }}
                >
                  Tomorrow 9 AM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScheduleDate(addDays(new Date(), 1));
                    setScheduleTime("18:00");
                  }}
                >
                  Tomorrow 6 PM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScheduleDate(addDays(new Date(), 7));
                    setScheduleTime("12:00");
                  }}
                >
                  Next Week Noon
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScheduleDate(new Date());
                    const now = new Date();
                    const nextHour = now.getHours() + 1;
                    setScheduleTime(`${nextHour.toString().padStart(2, '0')}:00`);
                  }}
                >
                  In 1 Hour
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={scheduleVideo}
                disabled={!scheduleDate}
              >
                Schedule Video
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSchedulingVideo(null);
                  setScheduleDate(undefined);
                  setScheduleTime("09:00");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
