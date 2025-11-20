import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import coinImage from "@/assets/voice2fire-coin.png";

type StoreLeaseManagerProps = {
  store: {
    id: string;
    user_id: string;
    lease_expiry: string | null;
    daily_lease_price: number;
    is_active: boolean;
  };
  onLeaseUpdate: () => void;
};

export function StoreLeaseManager({ store, onLeaseUpdate }: StoreLeaseManagerProps) {
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  const isExpired = store.lease_expiry ? new Date(store.lease_expiry) < new Date() : true;
  const daysRemaining = store.lease_expiry 
    ? Math.max(0, Math.ceil((new Date(store.lease_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handlePayLease = async (days: number) => {
    setPaying(true);
    try {
      const totalCost = store.daily_lease_price * days;

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", store.user_id)
        .single();

      if (!wallet || wallet.balance < totalCost) {
        toast({
          title: "Insufficient funds",
          description: `You need ${totalCost} coins. Current balance: ${wallet?.balance || 0} coins.`,
          variant: "destructive",
        });
        return;
      }

      // Calculate new expiry date
      const currentExpiry = store.lease_expiry && new Date(store.lease_expiry) > new Date() 
        ? new Date(store.lease_expiry) 
        : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      // Deduct coins
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - totalCost })
        .eq("user_id", store.user_id);

      if (walletError) throw walletError;

      // Update store lease
      const { error: storeError } = await supabase
        .from("stores")
        .update({ 
          lease_expiry: newExpiry.toISOString(),
          is_active: true 
        })
        .eq("id", store.id);

      if (storeError) throw storeError;

      toast({
        title: "Lease extended",
        description: `Your store lease has been extended for ${days} days!`,
      });

      onLeaseUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Card className={isExpired ? "border-destructive" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Store Lease
        </CardTitle>
        <CardDescription>
          Daily Rate: {store.daily_lease_price} <img src={coinImage} alt="coin" className="inline h-4 w-4" /> per day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isExpired ? "destructive" : store.is_active ? "default" : "secondary"}>
            {isExpired ? "Expired" : store.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {store.lease_expiry && !isExpired && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires:</span>
            <span className="text-sm">{format(new Date(store.lease_expiry), "MMM dd, yyyy")}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Days Remaining:</span>
          <span className="text-sm font-bold">{daysRemaining} days</span>
        </div>

        {isExpired && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Your store is inactive. Pay to reactivate.</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button 
            size="sm" 
            onClick={() => handlePayLease(7)}
            disabled={paying}
            variant="outline"
          >
            7 Days
            <br />
            <span className="text-xs flex items-center gap-1">
              {store.daily_lease_price * 7} <img src={coinImage} alt="coin" className="h-3 w-3" />
            </span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => handlePayLease(30)}
            disabled={paying}
          >
            30 Days
            <br />
            <span className="text-xs flex items-center gap-1">
              {store.daily_lease_price * 30} <img src={coinImage} alt="coin" className="h-3 w-3" />
            </span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => handlePayLease(365)}
            disabled={paying}
            variant="outline"
          >
            1 Year
            <br />
            <span className="text-xs flex items-center gap-1">
              {store.daily_lease_price * 365} <img src={coinImage} alt="coin" className="h-3 w-3" />
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
