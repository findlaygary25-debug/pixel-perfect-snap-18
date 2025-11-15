import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface Viewer {
  user_id: string;
  username: string;
  avatar_url?: string;
  joined_at: string;
}

interface ViewerListProps {
  liveStreamId: string;
  currentUserId: string;
  currentUsername: string;
  currentAvatar?: string;
  onViewerCountChange: (count: number) => void;
}

export default function ViewerList({ 
  liveStreamId, 
  currentUserId, 
  currentUsername,
  currentAvatar,
  onViewerCountChange 
}: ViewerListProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presence_${liveStreamId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const viewerList: Viewer[] = [];

        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key];
          if (presences && presences.length > 0) {
            const viewer = presences[0] as any;
            if (viewer.user_id && viewer.username) {
              viewerList.push({
                user_id: viewer.user_id,
                username: viewer.username,
                avatar_url: viewer.avatar_url,
                joined_at: viewer.joined_at
              });
            }
          }
        });

        setViewers(viewerList);
        onViewerCountChange(viewerList.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            username: currentUsername,
            avatar_url: currentAvatar,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [liveStreamId, currentUserId, currentUsername, currentAvatar, onViewerCountChange]);

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Viewers</h3>
          <span className="ml-auto text-sm text-muted-foreground">
            {viewers.length}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {viewers.map((viewer) => (
            <div key={viewer.user_id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={viewer.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {viewer.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{viewer.username}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(viewer.joined_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {viewers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm">
              No viewers yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
