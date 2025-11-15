import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Clock, Award } from "lucide-react";

interface WalletData {
  balance: number;
}

interface CommissionStats {
  totalEarned: number;
  pendingAmount: number;
  commissionsByLevel: Array<{ level: number; amount: number; count: number }>;
}

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setWallet(walletData);

      // Fetch commission statistics
      const { data: commissionsData } = await supabase
        .from("commissions")
        .select("amount, status, level")
        .eq("affiliate_id", user.id);

      if (commissionsData) {
        const totalEarned = commissionsData.reduce((sum, c) => sum + Number(c.amount), 0);
        const pendingAmount = commissionsData
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.amount), 0);

        // Group by level
        const levelMap = new Map<number, { amount: number; count: number }>();
        commissionsData.forEach(c => {
          const existing = levelMap.get(c.level) || { amount: 0, count: 0 };
          levelMap.set(c.level, {
            amount: existing.amount + Number(c.amount),
            count: existing.count + 1
          });
        });

        const commissionsByLevel = Array.from(levelMap.entries())
          .map(([level, data]) => ({ level, ...data }))
          .sort((a, b) => a.level - b.level);

        setCommissionStats({
          totalEarned,
          pendingAmount,
          commissionsByLevel
        });
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Wallet & Earnings</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const balance = wallet?.balance || 0;
  const totalEarned = commissionStats?.totalEarned || 0;
  const pendingAmount = commissionStats?.pendingAmount || 0;
  const paidAmount = totalEarned - pendingAmount;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Wallet & Earnings</h1>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${paidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown by Level */}
      {commissionStats && commissionStats.commissionsByLevel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown by Level</CardTitle>
            <CardDescription>Your earnings across all 5 affiliate levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissionStats.commissionsByLevel.map(({ level, amount, count }) => (
                <div key={level} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">L{level}</span>
                    </div>
                    <div>
                      <p className="font-medium">Level {level}</p>
                      <p className="text-sm text-muted-foreground">{count} commission{count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {commissionStats && commissionStats.commissionsByLevel.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Commissions Yet</CardTitle>
            <CardDescription>Start referring users to earn commissions!</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
