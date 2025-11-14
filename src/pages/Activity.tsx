import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type ActivityItem = {
  id: string;
  type: "video" | "comment";
  username: string;
  avatar_url?: string;
  content: string;
  video_url?: string;
  created_at: string;
};

export default function Activity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchActivities();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to realtime updates for videos and comments
    const videosChannel = supabase
      .channel('activity-videos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'videos'
        },
        async (payload) => {
          const newVideo = payload.new as any;
          
          // Check if this video is from a followed user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data: follows } = await supabase
            .from("follows")
            .select("followed_id")
            .eq("follower_id", session.user.id)
            .eq("followed_id", newVideo.user_id)
            .single();

          if (follows) {
            // Get avatar for the user
            const { data: profile } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("user_id", newVideo.user_id)
              .single();

            const newActivity: ActivityItem = {
              id: newVideo.id,
              type: "video",
              username: newVideo.username,
              avatar_url: profile?.avatar_url,
              content: newVideo.caption || "Posted a new video",
              video_url: newVideo.video_url,
              created_at: newVideo.created_at,
            };

            setActivities(prev => [newActivity, ...prev]);
          }
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('activity-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          const newComment = payload.new as any;
          
          // Check if this comment is from a followed user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data: follows } = await supabase
            .from("follows")
            .select("followed_id")
            .eq("follower_id", session.user.id)
            .eq("followed_id", newComment.user_id)
            .single();

          if (follows) {
            // Get avatar for the user
            const { data: profile } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("user_id", newComment.user_id)
              .single();

            const newActivity: ActivityItem = {
              id: newComment.id,
              type: "comment",
              username: newComment.username,
              avatar_url: profile?.avatar_url,
              content: newComment.comment_text,
              created_at: newComment.created_at,
            };

            setActivities(prev => [newActivity, ...prev]);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [isAuthenticated]);

  const checkAuthAndFetchActivities = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    await fetchActivities(session.user.id);
  };

  const fetchActivities = async (userId: string) => {
    try {
      // Get list of followed users
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) {
        setLoading(false);
        return;
      }

      const followedIds = follows.map(f => f.followed_id);

      // Fetch recent videos from followed users
      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("id, user_id, username, video_url, caption, created_at")
        .in("user_id", followedIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (videosError) throw videosError;

      // Fetch recent comments from followed users
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id, user_id, username, comment_text, video_id, created_at")
        .in("user_id", followedIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (commentsError) throw commentsError;

      // Get profiles for avatars
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, avatar_url")
        .in("user_id", followedIds);

      const avatarMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);

      // Combine and format activities
      const videoActivities: ActivityItem[] = (videos || []).map(v => ({
        id: v.id,
        type: "video" as const,
        username: v.username,
        avatar_url: avatarMap.get(v.user_id),
        content: v.caption || "Posted a new video",
        video_url: v.video_url,
        created_at: v.created_at,
      }));

      const commentActivities: ActivityItem[] = (comments || []).map(c => ({
        id: c.id,
        type: "comment" as const,
        username: c.username,
        avatar_url: avatarMap.get(c.user_id),
        content: c.comment_text,
        created_at: c.created_at,
      }));

      // Merge and sort by time
      const allActivities = [...videoActivities, ...commentActivities].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error",
        description: "Failed to load activity feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to see activity from people you follow
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No recent activity from people you follow. Start following creators to see their activity here!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Activity Feed</h1>
      <div className="space-y-4">
        {activities.map((activity) => (
          <Card key={`${activity.type}-${activity.id}`} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={activity.avatar_url} />
                  <AvatarFallback>{activity.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{activity.username}</span>
                    {activity.type === "video" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {activity.type === "video" ? "posted a video" : "commented"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground mb-2 break-words">
                    {activity.content}
                  </p>
                  
                  {activity.type === "video" && activity.video_url && (
                    <video
                      src={activity.video_url}
                      className="w-full max-h-64 rounded-lg object-cover"
                      controls
                    />
                  )}
                  
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
