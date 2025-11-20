import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Sparkles, Star, Zap, Crown, Check } from "lucide-react";
import { toast } from "sonner";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  icon: any;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: "p1", coins: 100, price: 0.99, icon: Coins },
  { id: "p2", coins: 500, price: 4.99, bonus: 50, icon: Sparkles },
  { id: "p3", coins: 1000, price: 9.99, bonus: 150, popular: true, icon: Star },
  { id: "p4", coins: 2500, price: 24.99, bonus: 500, icon: Zap },
  { id: "p5", coins: 5000, price: 49.99, bonus: 1200, icon: Crown },
];

export default function Wallet() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    setCoinBalance(data?.balance || 0);
    setLoading(false);
  };

  const handlePurchase = async (pkg: CoinPackage) => {
    setPurchasing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const totalCoins = pkg.coins + (pkg.bonus || 0);
      
      // Update wallet balance
      const { data: currentWallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const newBalance = (currentWallet?.balance || 0) + totalCoins;

      const { error } = await supabase
        .from("wallets")
        .upsert({ 
          user_id: user.id, 
          balance: newBalance,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchBalance();
      toast.success(`🎉 Successfully purchased ${totalCoins} coins!`);
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Coins</h1>
          <p className="text-muted-foreground">
            Get Coins to send Gifts and support creators
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {coinBalance.toLocaleString()} Coins
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Available to send as gifts
            </p>
          </CardContent>
        </Card>

        {/* Coin Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recharge Coins</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COIN_PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              const totalCoins = pkg.coins + (pkg.bonus || 0);
              
              return (
                <Card 
                  key={pkg.id}
                  className={`relative hover:shadow-lg transition-all ${
                    pkg.popular 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      {pkg.bonus && (
                        <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded">
                          +{pkg.bonus} Bonus
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl mt-4">
                      {totalCoins.toLocaleString()} Coins
                    </CardTitle>
                    {pkg.bonus && (
                      <p className="text-sm text-muted-foreground">
                        {pkg.coins.toLocaleString()} + {pkg.bonus} bonus
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-3xl font-bold">
                        ${pkg.price}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${(pkg.price / totalCoins).toFixed(4)} per coin
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasing}
                      className="w-full"
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      {purchasing ? "Processing..." : "Buy Now"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Why Buy Coins?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Support Creators</p>
                <p className="text-sm text-muted-foreground">
                  Send gifts to your favorite creators during LIVE streams
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Bonus Coins</p>
                <p className="text-sm text-muted-foreground">
                  Get extra coins with larger packages
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Secure Payment</p>
                <p className="text-sm text-muted-foreground">
                  Safe and encrypted payment processing
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Instant Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Coins are added to your account immediately
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
