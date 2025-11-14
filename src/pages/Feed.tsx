import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type VideoPost = {
  id: string;
  video_url: string;
  caption: string;
  username: string;
  likes: number;
  views: number;
};

export default function Feed() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
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

  const handleView = async (videoId: string) => {
    try {
      const video = videos.find((v) => v.id === videoId);
      if (!video) return;

      const { error } = await supabase
        .from("videos")
        .update({ views: video.views + 1 })
        .eq("id", videoId);

      if (error) throw error;

      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, views: v.views + 1 } : v))
      );
    } catch (error) {
      console.error("Error incrementing views:", error);
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
              <div className="flex flex-col gap-3">
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
                    <div className="flex flex-col items-center">
                      <Heart 
                        className={`h-5 w-5 transition-all ${likedVideos.has(v.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span className="text-xs">{v.likes}</span>
                    </div>
                  </Button>
                </motion.div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                  onClick={() => handleView(v.id)}
                >
                  <div className="flex flex-col items-center">
                    <Eye className="h-5 w-5" />
                    <span className="text-xs">{v.views}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
