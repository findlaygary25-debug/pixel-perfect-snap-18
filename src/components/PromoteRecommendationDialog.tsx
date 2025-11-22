import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Zap, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PromoteRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  toolCategory: string;
}

const promotionTiers = [
  {
    id: "basic",
    name: "Basic Boost",
    price: "price_1QqOHHBCkF8K3jHXI9gVQqYL", // Replace with actual Stripe price ID
    duration: "7 days",
    description: "Featured in category for 1 week",
    icon: TrendingUp,
    color: "text-blue-500",
  },
  {
    id: "premium",
    name: "Premium Spotlight",
    price: "price_1QqOHHBCkF8K3jHXJ9gVQqYM", // Replace with actual Stripe price ID
    duration: "30 days",
    description: "Featured in category + homepage for 1 month",
    icon: Zap,
    color: "text-purple-500",
  },
  {
    id: "platinum",
    name: "Platinum Featured",
    price: "price_1QqOHHBCkF8K3jHXK9gVQqYN", // Replace with actual Stripe price ID
    duration: "90 days",
    description: "Top placement everywhere for 3 months",
    icon: Rocket,
    color: "text-orange-500",
  },
];

export default function PromoteRecommendationDialog({
  open,
  onOpenChange,
  toolName,
  toolCategory,
}: PromoteRecommendationDialogProps) {
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePromote = async () => {
    if (!selectedTier) {
      toast({
        title: "Please select a promotion tier",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const tier = promotionTiers.find((t) => t.id === selectedTier);
      if (!tier) throw new Error("Invalid tier selected");

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: tier.price,
          metadata: {
            type: "recommendation_promotion",
            toolName,
            toolCategory,
            tier: tier.id,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to payment",
          description: "Complete your payment to activate the promotion",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to initiate promotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Promote {toolName}</DialogTitle>
          <DialogDescription>
            Boost visibility for "{toolName}" in the {toolCategory} category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Promotion Tier</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a promotion package" />
              </SelectTrigger>
              <SelectContent>
                {promotionTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <div className="flex items-center gap-2">
                      <tier.icon className={`w-4 h-4 ${tier.color}`} />
                      <span>{tier.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTier && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              {promotionTiers
                .filter((tier) => tier.id === selectedTier)
                .map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <div key={tier.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${tier.color}`} />
                        <h4 className="font-semibold">{tier.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                      <p className="text-sm font-medium">Duration: {tier.duration}</p>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePromote} disabled={!selectedTier || isProcessing} className="flex-1">
              {isProcessing ? "Processing..." : "Promote Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
