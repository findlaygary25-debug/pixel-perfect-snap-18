import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AICaptionGeneratorProps {
  onCaptionGenerated: (caption: string) => void;
}

export const AICaptionGenerator = ({ onCaptionGenerated }: AICaptionGeneratorProps) => {
  const [videoTitle, setVideoTitle] = useState("");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCaption = async () => {
    if (!videoTitle.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-caption', {
        body: { videoTitle, videoContext: context }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      onCaptionGenerated(data.caption);
      toast.success("Caption generated successfully!");
      setVideoTitle("");
      setContext("");
    } catch (error) {
      console.error('Error generating caption:', error);
      toast.error("Failed to generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Caption Generator</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="videoTitle">Video Title *</Label>
          <Input
            id="videoTitle"
            placeholder="Enter your video title"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <Label htmlFor="context">Additional Context (Optional)</Label>
          <Textarea
            id="context"
            placeholder="Add any details about your video..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        <Button
          onClick={generateCaption}
          disabled={isGenerating || !videoTitle.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Caption
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
