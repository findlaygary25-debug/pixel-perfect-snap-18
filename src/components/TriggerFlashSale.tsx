import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function TriggerFlashSale() {
  const [isLoading, setIsLoading] = useState(false);
  const [durationHours, setDurationHours] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(70);
  const [open, setOpen] = useState(false);

  const handleTrigger = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-flash-sale', {
        body: {
          duration_hours: durationHours,
          discount_percentage: discountPercentage,
        },
      });

      if (error) throw error;

      if (data.success) {
        const emailInfo = data.emails_sent > 0 ? `, ${data.emails_sent} emails sent` : '';
        toast.success("Flash Sale Triggered!", {
          description: `${data.items_updated} items on sale, ${data.notifications_sent} users notified${emailInfo}!`,
        });
        setOpen(false);
        
        // Refresh the page after a short delay to show the new banner
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error("Failed to trigger flash sale", {
          description: data.error,
        });
      }
    } catch (error: any) {
      console.error('Error triggering flash sale:', error);
      toast.error("Failed to trigger flash sale", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Trigger Flash Sale
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⚡ Trigger Flash Sale</DialogTitle>
          <DialogDescription>
            Configure and launch an instant flash sale with steep discounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Duration (hours)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[durationHours]}
                onValueChange={(value) => setDurationHours(value[0])}
                min={1}
                max={4}
                step={0.5}
                className="flex-1"
              />
              <Input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-20"
                min={1}
                max={4}
                step={0.5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Discount (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[discountPercentage]}
                onValueChange={(value) => setDiscountPercentage(value[0])}
                min={50}
                max={90}
                step={5}
                className="flex-1"
              />
              <Input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-20"
                min={50}
                max={90}
                step={5}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <p className="font-semibold">Preview:</p>
            <p>• Duration: {durationHours} hour{durationHours !== 1 ? 's' : ''}</p>
            <p>• Discount: {discountPercentage}% off</p>
            <p>• Items: Top 3 gold/platinum items</p>
            <p>• All users will be notified</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTrigger}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
          >
            {isLoading ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Launch Flash Sale
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
