import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface MoveToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoIds: string[];
  currentCollectionId: string;
  onComplete: () => void;
}

export function MoveToCollectionDialog({
  open,
  onOpenChange,
  videoIds,
  currentCollectionId,
  onComplete,
}: MoveToCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCollections();
      setSelectedCollection("");
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
        .neq("id", currentCollectionId)
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

  const handleMove = async () => {
    if (!selectedCollection) {
      toast.error("Please select a collection");
      return;
    }

    try {
      setMoving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the highest order_index in the target collection
      const { data: maxOrderData } = await supabase
        .from("collection_items")
        .select("order_index")
        .eq("collection_id", selectedCollection)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      const maxOrder = maxOrderData?.order_index ?? -1;

      // Delete from current collection
      const { error: deleteError } = await supabase
        .from("collection_items")
        .delete()
        .eq("collection_id", currentCollectionId)
        .in("video_id", videoIds);

      if (deleteError) throw deleteError;

      // Add to new collection
      const inserts = videoIds.map((videoId, index) => ({
        collection_id: selectedCollection,
        video_id: videoId,
        user_id: user.id,
        order_index: maxOrder + index + 1,
      }));

      const { error: insertError } = await supabase
        .from("collection_items")
        .insert(inserts);

      if (insertError) throw insertError;

      toast.success(`Moved ${videoIds.length} video${videoIds.length > 1 ? "s" : ""} to new collection!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving videos:", error);
      toast.error("Failed to move videos");
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
          <DialogDescription>
            Select a collection to move {videoIds.length} video{videoIds.length > 1 ? "s" : ""} to
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No other collections found. Create a new collection first.
            </div>
          ) : (
            <RadioGroup value={selectedCollection} onValueChange={setSelectedCollection}>
              <div className="space-y-3">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer" onClick={() => setSelectedCollection(collection.id)}>
                    <RadioGroupItem value={collection.id} id={collection.id} />
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
            </RadioGroup>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={moving}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={moving || !selectedCollection}>
            {moving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
