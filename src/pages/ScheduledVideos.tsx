import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Trash2, Eye, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, isPast } from "date-fns";

type ScheduledVideo = {
  id: string;
  youtube_video_id: string;
  youtube_title: string;
  youtube_description: string | null;
  youtube_thumbnail: string | null;
  youtube_channel: string | null;
  scheduled_time: string;
  status: string;
  created_at: string;
};

export default function ScheduledVideos() {
  const [videos, setVideos] = useState<ScheduledVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadScheduledVideos();

    // Realtime subscription for scheduled videos
    const channel = supabase
      .channel('scheduled-videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_videos'
        },
        () => {
          loadScheduledVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadScheduledVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading scheduled videos:', error);
      toast({
        title: "Error loading videos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledVideo = async (id: string) => {
    setDeleting(prev => new Set(prev).add(id));
    try {
      const { error } = await supabase
        .from('scheduled_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Video removed",
        description: "The scheduled video has been deleted",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string, scheduledTime: string) => {
    const isPastDue = isPast(new Date(scheduledTime));
    
    if (status === 'published') {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
    if (isPastDue && status === 'pending') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Publishing...</Badge>;
    }
    return <Badge><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
  };

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const publishedVideos = videos.filter(v => v.status === 'published');
  const failedVideos = videos.filter(v => v.status === 'failed');

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Videos</h1>
        <p className="text-muted-foreground mt-1">
          Manage your scheduled video publications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVideos.length}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to be published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedVideos.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedVideos.length}</div>
            <p className="text-xs text-muted-foreground">
              Failed to publish
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled videos. Schedule videos from the Import page!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                >
                  {video.youtube_thumbnail && (
                    <img
                      src={video.youtube_thumbnail}
                      alt={video.youtube_title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2">{video.youtube_title}</h3>
                        {video.youtube_channel && (
                          <p className="text-sm text-muted-foreground">{video.youtube_channel}</p>
                        )}
                      </div>
                      {getStatusBadge(video.status, video.scheduled_time)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(video.scheduled_time), "PPP 'at' p")}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(video.scheduled_time), { addSuffix: true })}
                      </span>
                    </div>

                    {video.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteScheduledVideo(video.id)}
                          disabled={deleting.has(video.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deleting.has(video.id) ? 'Deleting...' : 'Cancel Schedule'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
