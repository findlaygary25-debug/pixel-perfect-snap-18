import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SmartCollectionVideo {
  id: string;
  video_url: string;
  caption: string | null;
  username: string;
  likes: number;
  views: number;
  created_at: string;
}

interface RuleConfig {
  days?: number;
  minLikes?: number;
  minViews?: number;
}

export function useSmartCollectionVideos(
  ruleType: string | null,
  ruleConfig: RuleConfig | null,
  userId: string | null
) {
  const [videos, setVideos] = useState<SmartCollectionVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ruleType || !userId) {
      setLoading(false);
      return;
    }

    fetchVideos();
  }, [ruleType, userId, JSON.stringify(ruleConfig)]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("videos")
        .select("*")
        .eq("is_active", true);

      switch (ruleType) {
        case "followed_users": {
          // Get videos from users that the current user follows
          const { data: follows } = await supabase
            .from("follows")
            .select("followed_id")
            .eq("follower_id", userId);

          if (follows && follows.length > 0) {
            const followedIds = follows.map(f => f.followed_id);
            query = query.in("user_id", followedIds);
          } else {
            // No followed users, return empty
            setVideos([]);
            setLoading(false);
            return;
          }

          if (ruleConfig?.days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ruleConfig.days);
            query = query.gte("created_at", cutoffDate.toISOString());
          }
          break;
        }

        case "trending": {
          if (ruleConfig?.days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ruleConfig.days);
            query = query.gte("created_at", cutoffDate.toISOString());
          }
          if (ruleConfig?.minLikes) {
            query = query.gte("likes", ruleConfig.minLikes);
          }
          if (ruleConfig?.minViews) {
            query = query.gte("views", ruleConfig.minViews);
          }
          query = query.order("views", { ascending: false });
          break;
        }

        case "recent_likes": {
          // Get videos the user has liked
          const { data: engagement } = await supabase
            .from("video_engagement")
            .select("video_id, created_at")
            .eq("viewer_id", userId)
            .eq("engagement_type", "like")
            .order("created_at", { ascending: false })
            .limit(100);

          if (engagement && engagement.length > 0) {
            let videoIds = engagement.map(e => e.video_id);
            
            if (ruleConfig?.days) {
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - ruleConfig.days);
              videoIds = engagement
                .filter(e => new Date(e.created_at) >= cutoffDate)
                .map(e => e.video_id);
            }

            if (videoIds.length > 0) {
              query = query.in("id", videoIds);
            } else {
              setVideos([]);
              setLoading(false);
              return;
            }
          } else {
            setVideos([]);
            setLoading(false);
            return;
          }
          break;
        }

        case "high_engagement": {
          if (ruleConfig?.minLikes) {
            query = query.gte("likes", ruleConfig.minLikes);
          }
          if (ruleConfig?.minViews) {
            query = query.gte("views", ruleConfig.minViews);
          }
          query = query.order("likes", { ascending: false });
          break;
        }

        case "recent_uploads": {
          if (ruleConfig?.days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ruleConfig.days);
            query = query.gte("created_at", cutoffDate.toISOString());
          }
          query = query.order("created_at", { ascending: false });
          break;
        }

        default:
          setVideos([]);
          setLoading(false);
          return;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching smart collection videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, refetch: fetchVideos };
}
