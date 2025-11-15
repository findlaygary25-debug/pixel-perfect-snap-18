import { Facebook, Twitter, Linkedin, MessageCircle, Link2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SocialShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoCaption?: string;
  username: string;
};

export function SocialShareDialog({
  open,
  onOpenChange,
  videoId,
  videoCaption,
  username,
}: SocialShareDialogProps) {
  const videoUrl = `${window.location.origin}/video/${videoId}`;
  const shareText = videoCaption 
    ? `Check out this video by @${username}: ${videoCaption}` 
    : `Check out this video by @${username} on Voice2Fire!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      toast.success("Link copied to clipboard!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + videoUrl)}`;
    window.open(whatsappUrl, '_blank');
    onOpenChange(false);
  };

  const handleShareTikTok = () => {
    // TikTok doesn't have a direct share URL, so we copy and show instructions
    handleCopyLink();
    toast.info("Link copied! Open TikTok to share the video.");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Check out this video on Voice2Fire`);
    const body = encodeURIComponent(`${shareText}\n\n${videoUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Video</DialogTitle>
          <DialogDescription>
            Share this video with your friends and followers
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareFacebook}
          >
            <Facebook className="h-6 w-6 text-blue-600" />
            <span className="text-xs">Facebook</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareTwitter}
          >
            <Twitter className="h-6 w-6 text-sky-500" />
            <span className="text-xs">Twitter</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareLinkedIn}
          >
            <Linkedin className="h-6 w-6 text-blue-700" />
            <span className="text-xs">LinkedIn</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareWhatsApp}
          >
            <MessageCircle className="h-6 w-6 text-green-600" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareTikTok}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <span className="text-xs">TikTok</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
            onClick={handleShareEmail}
          >
            <Mail className="h-6 w-6 text-gray-600" />
            <span className="text-xs">Email</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
