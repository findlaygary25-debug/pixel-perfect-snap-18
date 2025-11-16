import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface BulkAddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoIds: string[];
  onComplete: () => void;
}

export function BulkAddToCollectionDialog({
  open,
  onOpenChange,
  videoIds,
  onComplete,
}: BulkAddToCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollections();
      setSelectedCollections(new Set());
    }
  }, [open]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("collections")
        .select("id, name, description")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedCollections.size === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the highest order_index for each collection
      const orderIndexPromises = Array.from(selectedCollections).map(async (collectionId) => {
        const { data } = await supabase
          .from("collection_items")
          .select("order_index")
          .eq("collection_id", collectionId)
          .order("order_index", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        return { collectionId, maxOrder: data?.order_index ?? -1 };
      });

      const orderIndexes = await Promise.all(orderIndexPromises);

      // Prepare bulk inserts for all collection-video combinations
      const inserts = [];
      for (const { collectionId, maxOrder } of orderIndexes) {
        for (let i = 0; i < videoIds.length; i++) {
          inserts.push({
            collection_id: collectionId,
            video_id: videoIds[i],
            user_id: user.id,
            order_index: maxOrder + i + 1,
          });
        }
      }

      // Insert all items (will skip duplicates due to unique constraint)
      const { error } = await supabase
        .from("collection_items")
        .upsert(inserts, { onConflict: "collection_id,video_id" });

      if (error) throw error;

      toast.success(`Added ${videoIds.length} video${videoIds.length > 1 ? "s" : ""} to ${selectedCollections.size} collection${selectedCollections.size > 1 ? "s" : ""}!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding to collections:", error);
      toast.error("Failed to add videos to collections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collections</DialogTitle>
          <DialogDescription>
            Select collections to add {videoIds.length} video{videoIds.length > 1 ? "s" : ""} to
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No collections found</div>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer" onClick={() => toggleCollection(collection.id)}>
                  <Checkbox
                    id={collection.id}
                    checked={selectedCollections.has(collection.id)}
                    onCheckedChange={() => toggleCollection(collection.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={collection.id} className="cursor-pointer font-medium">
                      {collection.name}
                    </Label>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground">{collection.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedCollections.size === 0}>
            {saving ? "Adding..." : `Add to ${selectedCollections.size || ""} Collection${selectedCollections.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
