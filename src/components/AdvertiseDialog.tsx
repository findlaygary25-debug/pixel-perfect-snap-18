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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, DollarSign } from "lucide-react";

interface AdvertiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvertiseDialog({ open, onOpenChange }: AdvertiseDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate video format
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file",
          description: "Please upload a video file",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !title || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const adAmount = parseFloat(amount);
    if (isNaN(adAmount) || adAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user
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

      if (!wallet || wallet.balance < adAmount) {
        toast({
          title: "Insufficient funds",
          description: "Please add funds to your wallet first",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Get referrer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", user.id)
        .single();

      // Upload video to storage
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("advertisements")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("advertisements").getPublicUrl(fileName);

      // Create advertisement
      const { error: adError } = await supabase.from("advertisements").insert({
        advertiser_id: user.id,
        referred_by: profile?.referred_by,
        title,
        description,
        media_url: publicUrl,
        media_type: "video",
        amount_spent: adAmount,
        status: "pending",
      });

      if (adError) throw adError;

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - adAmount })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      toast({
        title: "Success!",
        description:
          "Your ad has been submitted for review. You'll be notified once it's approved.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setAmount("");
      setVideoFile(null);
      onOpenChange(false);

      // Navigate to activity to see the ad
      navigate("/activity");
    } catch (error: any) {
      console.error("Error creating ad:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create advertisement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Advertisement</DialogTitle>
          <DialogDescription>
            Upload a video ad (9:16 format recommended). Your referrer will earn
            commissions from your ad spend.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video">
              Video (TikTok/YouTube Shorts format) *
            </Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="video"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    {videoFile ? videoFile.name : "Click to upload video"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP4, MOV, WebM (9:16 aspect ratio)
                  </p>
                </div>
                <input
                  id="video"
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your ad title"
              disabled={uploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your ad"
              disabled={uploading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Ad Budget ($) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                className="pl-9"
                disabled={uploading}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Funds will be deducted from your wallet balance
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ad"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
