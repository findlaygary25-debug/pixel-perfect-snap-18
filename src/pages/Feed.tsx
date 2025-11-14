import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CommentsDrawer from "@/components/CommentsDrawer";

type VideoPost = {
  id: string;
  video_url: string;
  caption: string;
  username: string;
  user_id: string;
  likes: number;
  views: number;
  comments?: number;
};

export default function Feed() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [followingVideos, setFollowingVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("forYou");

  useEffect(() => {
    fetchVideos();
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser && activeTab === "following") {
      fetchFollowingVideos();
    }
  }, [currentUser, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user.id);
      fetchBookmarks(user.id);
      fetchFollows(user.id);
    }
  };

  const fetchFollows = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", userId);

      if (error) throw error;
      setFollowedUsers(new Set(data?.map(f => f.followed_id) || []));
    } catch (error) {
      console.error("Error fetching follows:", error);
    }
  };

  const fetchBookmarks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("video_id")
        .eq("user_id", userId);

      if (error) throw error;
      setBookmarkedVideos(new Set(data?.map(b => b.video_id) || []));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
      
      if (data) {
        fetchCommentCounts(data.map(v => v.id));
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingVideos = async () => {
    if (!currentUser) return;
    
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", currentUser);

      if (followsError) throw followsError;
      
      const followedIds = followsData?.map(f => f.followed_id) || [];
      
      if (followedIds.length === 0) {
        setFollowingVideos([]);
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .in("user_id", followedIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFollowingVideos(data || []);
      
      if (data) {
        fetchCommentCounts(data.map(v => v.id));
      }
    } catch (error) {
      console.error("Error fetching following videos:", error);
    }
  };

  const fetchCommentCounts = async (videoIds: string[]) => {
    try {
      const counts: Record<string, number> = {};
      
      for (const videoId of videoIds) {
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);

        if (!error && count !== null) {
          counts[videoId] = count;
        }
      }
      
      setCommentCounts(counts);
    } catch (error) {
      console.error("Error fetching comment counts:", error);
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      const video = videos.find((v) => v.id === videoId) || followingVideos.find((v) => v.id === videoId);
      if (!video) return;

      const { error } = await supabase
        .from("videos")
        .update({ likes: video.likes + 1 })
        .eq("id", videoId);

      if (error) throw error;

      setLikedVideos((prev) => new Set(prev).add(videoId));
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
      );
      setFollowingVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
      );
      toast.success("Liked!");
    } catch (error) {
      console.error("Error liking video:", error);
      toast.error("Failed to like video");
    }
  };

  const handleBookmark = async (videoId: string) => {
    if (!currentUser) {
      toast.error("Please login to bookmark videos");
      return;
    }

    try {
      const isBookmarked = bookmarkedVideos.has(videoId);

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", currentUser)
          .eq("video_id", videoId);

        if (error) throw error;

        setBookmarkedVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
        toast.success("Bookmark removed");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: currentUser, video_id: videoId });

        if (error) throw error;

        setBookmarkedVideos((prev) => new Set(prev).add(videoId));
        toast.success("Video bookmarked!");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to bookmark video");
    }
  };

  const handleShare = async (videoId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/video/${videoId}`
      );
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing video:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      const isFollowing = followedUsers.has(userId);

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser)
          .eq("followed_id", userId);

        if (error) throw error;
        setFollowedUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        toast.success("Unfollowed");
      } else {
        const { error} = await supabase
          .from("follows")
          .insert({ follower_id: currentUser, followed_id: userId });

        if (error) throw error;
        setFollowedUsers(prev => new Set(prev).add(userId));
        toast.success("Following!");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("Failed to update follow status");
    }
  };

  const renderVideoCard = (video: VideoPost) => (
    <motion.div
      key={video.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-lg overflow-hidden mb-6"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold">{video.username[0].toUpperCase()}</span>
            </div>
            <span className="font-semibold">{video.username}</span>
          </div>
          {currentUser && video.user_id !== currentUser && (
            <Button
              variant={followedUsers.has(video.user_id) ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollow(video.user_id)}
            >
              {followedUsers.has(video.user_id) ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm mb-3">{video.caption}</p>
      </div>

      <video
        src={video.video_url}
        className="w-full aspect-video object-cover"
        controls
        preload="metadata"
      />

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(video.id)}
              className={likedVideos.has(video.id) ? "text-red-500" : ""}
            >
              <Heart
                className={`h-5 w-5 ${likedVideos.has(video.id) ? "fill-current" : ""}`}
              />
              <span className="ml-1">{video.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVideoId(video.id)}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="ml-1">{commentCounts[video.id] || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => handleShare(video.id)}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBookmark(video.id)}
            className={bookmarkedVideos.has(video.id) ? "text-primary" : ""}
          >
            <Bookmark
              className={`h-5 w-5 ${bookmarkedVideos.has(video.id) ? "fill-current" : ""}`}
            />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">🔥 Video Feed</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forYou">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="forYou" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading amazing content...</div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No videos yet</div>
            ) : (
              videos.map(renderVideoCard)
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            {!currentUser ? (
              <div className="text-center py-12 text-muted-foreground">
                Please login to see videos from people you follow
              </div>
            ) : followingVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No videos from followed users yet. Start following creators!
              </div>
            ) : (
              followingVideos.map(renderVideoCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CommentsDrawer
        videoId={selectedVideoId || ""}
        isOpen={!!selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
        commentCount={selectedVideoId ? commentCounts[selectedVideoId] || 0 : 0}
        onCommentAdded={() => {
          if (selectedVideoId) {
            fetchCommentCounts([selectedVideoId]);
          }
        }}
      />
    </div>
  );
}
