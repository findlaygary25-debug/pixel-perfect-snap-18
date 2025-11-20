import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Video } from "lucide-react";
import { AICaptionGenerator } from "@/components/AICaptionGenerator";

export default function Upload() {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setUser(user);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }
      
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be less than 100MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload video to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);

      // Create video record in database
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption: caption,
          username: user.email?.split("@")[0] || "user",
          is_active: true,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Your video has been uploaded",
      });

      navigate("/feed");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <AICaptionGenerator onCaptionGenerated={setCaption} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-6 w-6" />
            Upload Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="video-upload" className="block text-sm font-medium mb-2">
              Select Video
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: 100MB
            </p>
          </div>

          {preview && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Preview</label>
              <video
                src={preview}
                controls
                className="w-full max-h-96 rounded-lg bg-black"
              />
            </div>
          )}

          <div>
            <label htmlFor="caption" className="block text-sm font-medium mb-2">
              Caption
            </label>
            <Textarea
              id="caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {caption.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-foreground rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/feed")}
              disabled={uploading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
