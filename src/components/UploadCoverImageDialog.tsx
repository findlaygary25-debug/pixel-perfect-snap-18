import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface UploadCoverImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentCoverUrl?: string | null;
  onUploadComplete: () => void;
}

export function UploadCoverImageDialog({
  open,
  onOpenChange,
  collectionId,
  currentCoverUrl,
  onUploadComplete,
}: UploadCoverImageDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${collectionId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      // Update collection
      const { error: updateError } = await supabase
        .from("collections")
        .update({ cover_image_url: publicUrl })
        .eq("id", collectionId);

      if (updateError) throw updateError;

      toast.success("Cover image updated!");
      onUploadComplete();
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast.error("Failed to upload cover image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    try {
      setUploading(true);
      const { error } = await supabase
        .from("collections")
        .update({ cover_image_url: null })
        .eq("id", collectionId);

      if (error) throw error;

      toast.success("Cover image removed!");
      onUploadComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error removing cover:", error);
      toast.error("Failed to remove cover image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collection Cover Image</DialogTitle>
          <DialogDescription>
            Upload a custom cover image for this collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-image">Select Image</Label>
            <Input
              id="cover-image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max size: 5MB. Recommended: 1200x630px
            </p>
          </div>

          {(previewUrl || currentCoverUrl) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl || currentCoverUrl || ""}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentCoverUrl && !selectedFile && (
            <Button
              variant="destructive"
              onClick={handleRemoveCover}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove Cover
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
