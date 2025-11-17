import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function GiftLeaderboard() {
  const { data: topSenders, isLoading: sendersLoading } = useQuery({
    queryKey: ['top-gift-senders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gift_balances')
        .select(`
          *,
          profiles!gift_balances_user_id_fkey(username, avatar_url)
        `)
        .order('total_sent', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  const { data: topReceivers, isLoading: receiversLoading } = useQuery({
    queryKey: ['top-gift-receivers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('gift_balances')
        .select(`
          *,
          profiles!gift_balances_user_id_fkey(username, avatar_url)
        `)
        .order('total_received', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700">3rd</Badge>;
    return <Badge variant="secondary">#{rank}</Badge>;
  };

  if (sendersLoading || receiversLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gift Leaderboard</h1>
          <p className="text-muted-foreground">Top gifters and most appreciated creators</p>
        </div>
      </div>

      <Tabs defaultValue="senders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="senders" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Top Senders
          </TabsTrigger>
          <TabsTrigger value="receivers" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Receivers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="senders" className="space-y-4">
          {topSenders && topSenders.length > 0 ? (
            <div className="grid gap-3">
              {topSenders.map((entry: any, index: number) => (
                <Card key={entry.id} className={index < 3 ? "border-primary/50" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.profiles?.avatar_url} />
                      <AvatarFallback>
                        {entry.profiles?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">@{entry.profiles?.username || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        Generous supporter
                      </p>
                    </div>
                    <div className="text-right">
                      {getRankBadge(index + 1)}
                      <p className="text-2xl font-bold text-blue-500 mt-1">
                        {entry.total_sent?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Gifts Sent</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No gift senders yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="receivers" className="space-y-4">
          {topReceivers && topReceivers.length > 0 ? (
            <div className="grid gap-3">
              {topReceivers.map((entry: any, index: number) => (
                <Card key={entry.id} className={index < 3 ? "border-primary/50" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.profiles?.avatar_url} />
                      <AvatarFallback>
                        {entry.profiles?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">@{entry.profiles?.username || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        Appreciated creator
                      </p>
                    </div>
                    <div className="text-right">
                      {getRankBadge(index + 1)}
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        {entry.total_received?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Gifts Received</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No gift receivers yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
