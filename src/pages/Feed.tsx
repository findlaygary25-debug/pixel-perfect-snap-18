import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CommentsDrawer from "@/components/CommentsDrawer";

type VideoPost = {
  id: string;
  video_url: string;
  caption: string;
  username: string;
  likes: number;
  views: number;
  comments?: number;
};

export default function Feed() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchVideos();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user.id);
      fetchBookmarks(user.id);
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
      
      // Fetch comment counts for each video
      if (data) {
        fetchCommentCounts(data.map(v => v.id));
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
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
      const video = videos.find((v) => v.id === videoId);
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse">Loading videos...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white text-center p-4">
        <div>
          <p className="text-xl mb-2">No videos yet</p>
          <p className="text-sm text-gray-400">Be the first to share content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white">
      {videos.map((v) => (
        <motion.div
          key={v.id}
          className="h-screen flex flex-col justify-end items-center snap-start relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <video
            src={v.video_url}
            className="absolute inset-0 w-full h-full object-cover"
            controls
            loop
            autoPlay
            muted
          />
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <div className="flex justify-between items-end">
              <div className="text-left flex-1">
                <p className="font-bold text-white drop-shadow-lg">@{v.username}</p>
                <p className="text-sm text-gray-200 drop-shadow-lg">{v.caption}</p>
              </div>
              <div className="flex flex-col gap-4 items-center">
                {/* Follow Button with Avatar */}
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{v.username[0].toUpperCase()}</span>
                  </div>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary hover:bg-primary/90"
                  >
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Like Button */}
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  animate={likedVideos.has(v.id) ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                    onClick={() => handleLike(v.id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Heart 
                        className={`h-6 w-6 transition-all ${likedVideos.has(v.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span className="text-xs font-semibold">{v.likes}</span>
                    </div>
                  </Button>
                </motion.div>

                {/* Comments Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                  onClick={() => setSelectedVideoId(v.id)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-xs font-semibold">{commentCounts[v.id] || 0}</span>
                  </div>
                </Button>

                {/* Bookmark Button */}
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  animate={bookmarkedVideos.has(v.id) ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                    onClick={() => handleBookmark(v.id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Bookmark 
                        className={`h-6 w-6 transition-all ${bookmarkedVideos.has(v.id) ? 'fill-yellow-500 text-yellow-500' : ''}`}
                      />
                    </div>
                  </Button>
                </motion.div>

                {/* Share Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Share2 className="h-6 w-6" />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {selectedVideoId && (
        <CommentsDrawer
          videoId={selectedVideoId}
          isOpen={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
          commentCount={commentCounts[selectedVideoId] || 0}
          onCommentAdded={() => {
            fetchCommentCounts([selectedVideoId]);
          }}
        />
      )}
    </div>
  );
}
