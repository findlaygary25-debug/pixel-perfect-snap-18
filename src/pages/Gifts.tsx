import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function Gifts() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: giftBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['gift-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('gift_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const { data: sentGifts, isLoading: sentLoading } = useQuery({
    queryKey: ['sent-gifts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('gift_transactions')
        .select(`
          *,
          gift:gift_catalog(*),
          recipient:profiles!gift_transactions_recipient_id_fkey(username, avatar_url)
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: receivedGifts, isLoading: receivedLoading } = useQuery({
    queryKey: ['received-gifts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('gift_transactions')
        .select(`
          *,
          gift:gift_catalog(*),
          sender:profiles!gift_transactions_sender_id_fkey(username, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id
  });

  if (balanceLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Gift className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Gift History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(giftBalance?.total_received || 0).toLocaleString()} Gifts
            </div>
            <p className="text-xs text-muted-foreground">
              From {receivedGifts?.length || 0} supporters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(giftBalance?.total_sent || 0).toLocaleString()} Gifts
            </div>
            <p className="text-xs text-muted-foreground">
              To {sentGifts?.length || 0} creators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((giftBalance?.total_received || 0) - (giftBalance?.total_sent || 0)).toLocaleString()} Gifts
            </div>
            <p className="text-xs text-muted-foreground">
              Received - Sent
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">Received Gifts</TabsTrigger>
          <TabsTrigger value="sent">Sent Gifts</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : receivedGifts && receivedGifts.length > 0 ? (
            <div className="grid gap-4">
              {receivedGifts.map((transaction: any) => (
                <Card key={transaction.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={transaction.gift.image_url}
                      alt={transaction.gift.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{transaction.gift.name}</p>
                      <p className="text-sm text-muted-foreground">
                        From @{transaction.sender?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">
                        +{transaction.gift_value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Gifts</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No gifts received yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sentGifts && sentGifts.length > 0 ? (
            <div className="grid gap-4">
              {sentGifts.map((transaction: any) => (
                <Card key={transaction.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={transaction.gift.image_url}
                      alt={transaction.gift.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{transaction.gift.name}</p>
                      <p className="text-sm text-muted-foreground">
                        To @{transaction.recipient?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-500">
                        -{transaction.gift_value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Gifts</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No gifts sent yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
