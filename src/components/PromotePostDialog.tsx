import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, Zap, CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface PromotePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoUrl: string;
  caption: string;
}

const PROMOTION_TIERS = [
  {
    id: 1,
    name: "Starter Boost",
    price: 5,
    reach: "1,000",
    icon: Users,
    description: "Perfect for getting started",
  },
  {
    id: 2,
    name: "Growth Pack",
    price: 15,
    reach: "5,000",
    icon: TrendingUp,
    description: "Expand your audience",
    popular: true,
  },
  {
    id: 3,
    name: "Viral Push",
    price: 30,
    reach: "15,000",
    icon: Zap,
    description: "Maximum visibility",
  },
  {
    id: 4,
    name: "Premium Reach",
    price: 50,
    reach: "30,000",
    icon: TrendingUp,
    description: "Go viral fast",
  },
  {
    id: 5,
    name: "Ultimate Boost",
    price: 100,
    reach: "75,000",
    icon: Zap,
    description: "Explosive growth",
  },
];

export function PromotePostDialog({
  open,
  onOpenChange,
  videoId,
  videoUrl,
  caption,
}: PromotePostDialogProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePromote = async () => {
    if (!selectedTier) {
      toast({
        title: "Select a tier",
        description: "Please select a promotion tier",
        variant: "destructive",
      });
      return;
    }

    if (startDate && endDate && endDate <= startDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const tier = PROMOTION_TIERS.find((t) => t.id === selectedTier);
    if (!tier) return;

    setPromoting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || wallet.balance < tier.price) {
        toast({
          title: "Insufficient funds",
          description: "Please add funds to your wallet first",
          variant: "destructive",
        });
        setPromoting(false);
        return;
      }

      // Get referrer info from affiliate_links
      const { data: affiliateLink } = await supabase
        .from("affiliate_links")
        .select("sponsor_id")
        .eq("user_id", user.id)
        .single();

      // Create promotion as advertisement
      const { data: ad, error: adError } = await supabase.from("advertisements").insert({
        advertiser_id: user.id,
        referred_by: affiliateLink?.sponsor_id,
        title: `Promoted Post - ${tier.name}`,
        description: caption || "Promoted video post",
        media_url: videoUrl,
        media_type: "video",
        amount_spent: tier.price,
        status: "pending",
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      })
      .select()
      .single();

      if (adError) throw adError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - tier.price })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      // Calculate affiliate commissions if user has a sponsor
      if (affiliateLink?.sponsor_id && ad?.id) {
        try {
          await supabase.functions.invoke("calculate-ad-commissions", {
            body: { adId: ad.id },
          });
          console.log("Ad commissions calculated successfully");
        } catch (commError) {
          console.error("Error calculating ad commissions:", commError);
          // Don't fail the promotion if commission calculation fails
        }
      }

      toast({
        title: "Post promoted!",
        description: `Your post will reach approximately ${tier.reach} people`,
      });

      onOpenChange(false);
      navigate("/activity");
    } catch (error: any) {
      console.error("Error promoting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to promote post",
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promote Your Post</DialogTitle>
          <DialogDescription>
            Choose a promotion tier to boost your post's visibility and reach more
            people. Your referrer will earn commissions from your promotion spend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Leave empty to start immediately
              </p>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0));
                      if (startDate) {
                        return date < startDate;
                      }
                      return date < today;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Leave empty for indefinite promotion
              </p>
            </div>
          </div>

          <div className="grid gap-3">
          {PROMOTION_TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTier === tier.id
                    ? "border-primary ring-2 ring-primary"
                    : ""
                } ${tier.popular ? "relative" : ""}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{tier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${tier.price}</div>
                    <div className="text-sm text-muted-foreground">
                      ~{tier.reach} reach
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={promoting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={promoting || !selectedTier}
            className="flex-1"
          >
            {promoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              "Promote Post"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
