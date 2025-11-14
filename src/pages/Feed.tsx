import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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
          <div className="absolute bottom-20 left-4 text-left z-10">
            <p className="font-bold text-white drop-shadow-lg">@{v.username}</p>
            <p className="text-sm text-gray-200 drop-shadow-lg">{v.caption}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-300">
              <span>❤️ {v.likes}</span>
              <span>👁️ {v.views}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
