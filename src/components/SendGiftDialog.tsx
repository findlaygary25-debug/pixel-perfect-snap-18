import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SendGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientUsername: string;
}

export function SendGiftDialog({ open, onOpenChange, recipientId, recipientUsername }: SendGiftDialogProps) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { data: gifts, isLoading } = useQuery({
    queryKey: ['gift-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_catalog')
        .select('*')
        .eq('is_active', true)
        .order('gift_value', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: affiliateData } = useQuery({
    queryKey: ['recipient-affiliate', recipientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('user_id', recipientId)
        .single();
      return data;
    },
    enabled: !!recipientId
  });

  const handleSendGift = async () => {
    if (!selectedGift || !currentUser) return;

    setIsSending(true);
    try {
      const gift = gifts?.find(g => g.id === selectedGift);
      if (!gift) throw new Error('Gift not found');

      // Calculate fees (20% platform fee)
      const platformFee = gift.price_usd * 0.20;
      const affiliateCommission = affiliateData?.referred_by ? gift.price_usd * 0.05 : 0;

      const { error } = await supabase
        .from('gift_transactions')
        .insert({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          gift_id: gift.id,
          gift_value: gift.gift_value,
          platform_fee: platformFee,
          affiliate_commission: affiliateCommission,
          affiliate_id: affiliateData?.referred_by || null
        });

      if (error) throw error;

      toast.success(`🎁 Sent ${gift.name} to ${recipientUsername}!`);
      onOpenChange(false);
      setSelectedGift(null);
    } catch (error: any) {
      console.error('Error sending gift:', error);
      toast.error(error.message || 'Failed to send gift');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Gift to {recipientUsername}</DialogTitle>
          <DialogDescription>
            Choose a gift to send. The recipient will receive 80% of the gift value in their wallet, and Voice2Fire will earn 20% platform fee.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {gifts?.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift.id)}
                className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                  selectedGift === gift.id
                    ? 'border-primary scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="aspect-square overflow-hidden rounded-t-md">
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-card">
                  <p className="font-semibold text-sm">{gift.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {gift.gift_value.toLocaleString()} Gifts
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    ${gift.price_usd}
                  </p>
                </div>
                {selectedGift === gift.id && (
                  <div className="absolute inset-0 bg-primary/10 rounded-lg pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendGift}
            disabled={!selectedGift || isSending}
            className="flex-1"
          >
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Gift
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
