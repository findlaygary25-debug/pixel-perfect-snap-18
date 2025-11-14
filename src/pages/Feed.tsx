import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type VideoPost = {
  id: number;
  src: string;
  caption: string;
  user: string;
};

export default function Feed() {
  const [videos, setVideos] = useState<VideoPost[]>([]);

  useEffect(() => {
    // Placeholder content (later we'll fetch from Supabase storage)
    setVideos([
      { id: 1, src: "/videos/sample1.mp4", caption: "🔥 Voice2Fire Rising!", user: "@voice2fire" },
      { id: 2, src: "/videos/sample2.mp4", caption: "Remnant calling forth", user: "@remnant" },
    ]);
  }, []);

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
            src={v.src}
            className="absolute inset-0 w-full h-full object-cover"
            controls
            loop
            autoPlay
            muted
          />
          <div className="absolute bottom-20 left-4 text-left">
            <p className="font-bold">{v.user}</p>
            <p className="text-sm text-gray-300">{v.caption}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
