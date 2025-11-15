import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, User, Clock, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ShareWithDetails = {
  id: string;
  video_id: string;
  platform: string;
  shared_at: string;
  sharer_username: string;
  video_caption: string | null;
};

type PlatformStats = {
  platform: string;
  count: number;
  percentage: number;
};

export default function Shares() {
  const [shares, setShares] = useState<ShareWithDetails[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    loadShares();

    // Realtime subscription for new shares
    const channel = supabase
      .channel('shares-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_shares'
        },
        () => {
          loadShares();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadShares = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all shares for videos owned by the current user
      const { data: sharesData, error } = await supabase
        .from('social_shares')
        .select(`
          id,
          video_id,
          platform,
          shared_at,
          user_id,
          videos!inner(caption, user_id)
        `)
        .eq('videos.user_id', user.id)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      // Get usernames for sharers
      const userIds = [...new Set(sharesData?.map(s => (s as any).user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      const enrichedShares: ShareWithDetails[] = (sharesData || []).map(share => ({
        id: share.id,
        video_id: share.video_id,
        platform: share.platform,
        shared_at: share.shared_at,
        sharer_username: profileMap.get((share as any).user_id) || 'Anonymous',
        video_caption: (share as any).videos?.caption || null,
      }));

      setShares(enrichedShares);
      setTotalShares(enrichedShares.length);

      // Calculate platform statistics
      const platformCounts = enrichedShares.reduce((acc, share) => {
        acc[share.platform] = (acc[share.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats: PlatformStats[] = Object.entries(platformCounts)
        .map(([platform, count]) => ({
          platform,
          count,
          percentage: Math.round((count / enrichedShares.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setPlatformStats(stats);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      facebook: 'bg-blue-500',
      twitter: 'bg-sky-500',
      linkedin: 'bg-blue-700',
      whatsapp: 'bg-green-600',
      tiktok: 'bg-black',
      email: 'bg-gray-600',
      copy_link: 'bg-purple-500',
    };
    return colors[platform] || 'bg-muted';
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      copy_link: 'Copy Link',
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      whatsapp: 'WhatsApp',
      tiktok: 'TikTok',
      email: 'Email',
    };
    return labels[platform] || platform;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Shares</h1>
          <p className="text-muted-foreground mt-1">
            Track how your videos are being shared across platforms
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        {platformStats.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Platform</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPlatformLabel(platformStats[0].platform)}</div>
              <p className="text-xs text-muted-foreground">
                {platformStats[0].count} shares ({platformStats[0].percentage}%)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Platform Breakdown */}
      {platformStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platformStats.map((stat) => (
                <div key={stat.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getPlatformColor(stat.platform)}`} />
                    <span className="font-medium">{getPlatformLabel(stat.platform)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${getPlatformColor(stat.platform)}`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {stat.count} ({stat.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shares List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shares</CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shares yet. Share your videos to see them here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getPlatformColor(share.platform)}>
                        {getPlatformLabel(share.platform)}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{share.sharer_username}</span>
                      </div>
                    </div>
                    
                    {share.video_caption && (
                      <div className="flex items-start gap-2">
                        <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm line-clamp-2">{share.video_caption}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(share.shared_at), { addSuffix: true })}</span>
                    </div>
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
