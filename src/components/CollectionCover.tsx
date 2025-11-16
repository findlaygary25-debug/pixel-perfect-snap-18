import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";

interface CollectionCoverProps {
  collectionId: string;
  customCoverUrl?: string | null;
  className?: string;
}

export function CollectionCover({ collectionId, customCoverUrl, className = "" }: CollectionCoverProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customCoverUrl) {
      setLoading(false);
      return;
    }

    const fetchThumbnails = async () => {
      try {
        const { data, error } = await supabase
          .from("collection_items")
          .select(`
            video_id,
            videos (
              video_url,
              caption
            )
          `)
          .eq("collection_id", collectionId)
          .order("order_index", { ascending: true })
          .limit(4);

        if (error) throw error;

        const urls = data
          ?.map((item: any) => item.videos?.video_url)
          .filter(Boolean)
          .slice(0, 4) || [];
        
        setThumbnails(urls);
      } catch (error) {
        console.error("Error fetching thumbnails:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnails();
  }, [collectionId, customCoverUrl]);

  if (loading) {
    return (
      <div className={`bg-muted animate-pulse rounded-lg ${className}`} />
    );
  }

  if (customCoverUrl) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted ${className}`}>
        <img 
          src={customCoverUrl} 
          alt="Collection cover"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  const gridClass = thumbnails.length === 1 
    ? "grid-cols-1" 
    : thumbnails.length === 2 
    ? "grid-cols-2" 
    : "grid-cols-2 grid-rows-2";

  return (
    <div className={`relative overflow-hidden rounded-lg bg-muted ${className}`}>
      <div className={`grid ${gridClass} gap-0.5 h-full`}>
        {thumbnails.map((url, index) => (
          <div key={index} className="relative bg-muted">
            <video
              src={url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          </div>
        ))}
      </div>
    </div>
  );
}
