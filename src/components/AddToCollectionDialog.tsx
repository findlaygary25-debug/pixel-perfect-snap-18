import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Folder, FolderPlus, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
};

type AddToCollectionDialogProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  currentUser: string | null;
};

export function AddToCollectionDialog({ open, onClose, videoId, currentUser }: AddToCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => {
    if (open && currentUser) {
      fetchCollections();
      fetchVideoCollections();
    }
  }, [open, currentUser, videoId]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const fetchVideoCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_items")
        .select("collection_id")
        .eq("video_id", videoId);

      if (error) throw error;
      
      const collectionIds = new Set((data || []).map(item => item.collection_id));
      setSelectedCollections(collectionIds);
    } catch (error) {
      console.error("Error fetching video collections:", error);
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    if (!currentUser) return;

    const isCurrentlySelected = selectedCollections.has(collectionId);
    
    try {
      if (isCurrentlySelected) {
        // Remove from collection
        const { error } = await supabase
          .from("collection_items")
          .delete()
          .eq("collection_id", collectionId)
          .eq("video_id", videoId);

        if (error) throw error;

        setSelectedCollections(prev => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      } else {
        // Add to collection
        const { error } = await supabase
          .from("collection_items")
          .insert({
            collection_id: collectionId,
            video_id: videoId,
            user_id: currentUser,
          });

        if (error) throw error;

        setSelectedCollections(prev => new Set(prev).add(collectionId));
      }
    } catch (error) {
      console.error("Error toggling collection:", error);
      toast.error("Failed to update collection");
    }
  };

  const handleCreateCollection = async () => {
    if (!currentUser || !newCollectionName.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("collections")
        .insert({
          user_id: currentUser,
          name: newCollectionName.trim(),
          order_index: collections.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Add video to new collection
      await supabase
        .from("collection_items")
        .insert({
          collection_id: data.id,
          video_id: videoId,
          user_id: currentUser,
        });

      toast.success("Collection created and video added!");
      setCreateMode(false);
      setNewCollectionName("");
      fetchCollections();
      fetchVideoCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
          <DialogDescription>
            Choose which collections to add this video to
          </DialogDescription>
        </DialogHeader>

        {createMode ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Favorites"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreateMode(false);
                  setNewCollectionName("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || loading}
              >
                Create & Add
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No collections yet</p>
                  </div>
                ) : (
                  collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleToggleCollection(collection.id)}
                    >
                      <Checkbox
                        checked={selectedCollections.has(collection.id)}
                        onCheckedChange={() => handleToggleCollection(collection.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{collection.name}</span>
                          {collection.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      {selectedCollections.has(collection.id) && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCreateMode(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
              <Button className="w-full" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
