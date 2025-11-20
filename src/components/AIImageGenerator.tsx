import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AIImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-image', {
        body: { prompt, type: 'thumbnail' }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setImageUrl(data.imageUrl);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Image Generator</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="imagePrompt">Describe your image</Label>
          <Textarea
            id="imagePrompt"
            placeholder="e.g., A vibrant thumbnail for a cooking video with a chef hat and flames"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>

        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {imageUrl && (
          <div className="space-y-3">
            <img
              src={imageUrl}
              alt="Generated"
              className="w-full rounded-lg border border-border"
            />
            <Button
              onClick={downloadImage}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
