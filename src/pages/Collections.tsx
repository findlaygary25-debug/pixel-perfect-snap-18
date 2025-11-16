import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FolderPlus, Trash2, Edit, Play, GripVertical, Image, Copy, Sparkles } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { CollectionCover } from "@/components/CollectionCover";
import { UploadCoverImageDialog } from "@/components/UploadCoverImageDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateSmartCollectionDialog } from "@/components/CreateSmartCollectionDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from "react-router-dom";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  order_index: number;
  created_at: string;
  video_count?: number;
  cover_image_url?: string | null;
  is_smart: boolean;
  rule_type?: string | null;
  rule_config?: any;
};

function SortableCollectionCard({ collection, onEdit, onDelete, onCoverUpdate, onDuplicate }: { 
  collection: Collection; 
  onEdit: () => void; 
  onDelete: () => void;
  onCoverUpdate: () => void;
  onDuplicate: () => void;
}) {
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card className={isDragging ? 'shadow-2xl' : ''}>
          <div className="flex gap-4 p-4">
            <div className="flex-shrink-0">
              <button
                className="cursor-grab active:cursor-grabbing touch-none"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div 
              className="flex-shrink-0 cursor-pointer group relative"
              onClick={() => setUploadDialogOpen(true)}
            >
              <CollectionCover
                collectionId={collection.id}
                customCoverUrl={collection.cover_image_url}
                className="w-32 h-32"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Image className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <CardHeader className="p-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {collection.is_smart && (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      {collection.name}
                      {collection.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Default</span>
                      )}
                      {collection.is_smart && (
                        <span className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-full">Smart</span>
                      )}
                    </CardTitle>
                    {collection.description && (
                      <CardDescription className="mt-1">{collection.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDuplicate}
                      title="Duplicate collection"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onEdit}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!collection.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {collection.video_count || 0} videos
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/collections/${collection.id}`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>

      <UploadCoverImageDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        collectionId={collection.id}
        currentCoverUrl={collection.cover_image_url}
        onUploadComplete={onCoverUpdate}
      />
    </>
  );
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [duplicatingCollection, setDuplicatingCollection] = useState<Collection | null>(null);
  const [smartCollectionDialogOpen, setSmartCollectionDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    checkUser();
    fetchCollections();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user?.id || null);
  };

  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      // Fetch collections with video counts
      const { data: collectionsData, error } = await supabase
        .from("collections")
        .select("*, cover_image_url")
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Fetch video counts for each collection
      const collectionsWithCounts = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          const { count } = await supabase
            .from("collection_items")
            .select("*", { count: 'exact', head: true })
            .eq("collection_id", collection.id);
          
          return { ...collection, video_count: count || 0 };
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((c) => c.id === active.id);
    const newIndex = collections.findIndex((c) => c.id === over.id);

    const newCollections = arrayMove(collections, oldIndex, newIndex);
    setCollections(newCollections);

    // Update order in database
    try {
      const updates = newCollections.map((collection, index) => ({
        id: collection.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from("collections")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      toast.success("Collection order updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
      fetchCollections(); // Revert on error
    }
  };

  const handleCreateCollection = async () => {
    if (!currentUser || !newCollectionName.trim()) return;

    try {
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: currentUser,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          order_index: collections.length,
        });

      if (error) throw error;

      toast.success("Collection created!");
      setCreateDialogOpen(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      fetchCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    try {
      const { error } = await supabase
        .from("collections")
        .update({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
        })
        .eq("id", editingCollection.id);

      if (error) throw error;

      toast.success("Collection updated!");
      setEditingCollection(null);
      setNewCollectionName("");
      setNewCollectionDescription("");
      fetchCollections();
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection? All videos in this collection will be removed from it.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId);

      if (error) throw error;

      toast.success("Collection deleted");
      fetchCollections();
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDescription(collection.description || "");
  };

  const handleDuplicateCollection = async (collection: Collection) => {
    if (!currentUser) return;

    try {
      // Create new collection with copied name
      const { data: newCollection, error: createError } = await supabase
        .from("collections")
        .insert({
          user_id: currentUser,
          name: `${collection.name} (Copy)`,
          description: collection.description,
          order_index: collections.length,
          cover_image_url: collection.cover_image_url,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get all items from the original collection
      const { data: items, error: itemsError } = await supabase
        .from("collection_items")
        .select("video_id, order_index")
        .eq("collection_id", collection.id)
        .order("order_index", { ascending: true });

      if (itemsError) throw itemsError;

      // Copy items to new collection
      if (items && items.length > 0) {
        const newItems = items.map((item) => ({
          collection_id: newCollection.id,
          video_id: item.video_id,
          user_id: currentUser,
          order_index: item.order_index,
        }));

        const { error: insertError } = await supabase
          .from("collection_items")
          .insert(newItems);

        if (insertError) throw insertError;
      }

      toast.success(`Collection duplicated! ${items?.length || 0} videos copied.`);
      fetchCollections();
    } catch (error) {
      console.error("Error duplicating collection:", error);
      toast.error("Failed to duplicate collection");
    }
  };

  if (!currentUser) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground">Please login to manage your collections</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Collections</h1>
          <p className="text-muted-foreground mt-1">Organize your saved videos into playlists</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Regular Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSmartCollectionDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Smart Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">Create your first collection to start organizing videos</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Drag collections to reorder them</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={collections.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {collections.map((collection) => (
                <SortableCollectionCard
                  key={collection.id}
                  collection={collection}
                  onEdit={() => openEditDialog(collection)}
                  onDelete={() => handleDeleteCollection(collection.id)}
                  onCoverUpdate={fetchCollections}
                  onDuplicate={() => setDuplicatingCollection(collection)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Smart Collection Dialog */}
      <CreateSmartCollectionDialog
        open={smartCollectionDialogOpen}
        onOpenChange={setSmartCollectionDialogOpen}
        onSuccess={fetchCollections}
      />

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={!!duplicatingCollection} onOpenChange={(open) => !open && setDuplicatingCollection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicatingCollection?.is_smart 
                ? `This will create a copy of the smart collection "${duplicatingCollection?.name}" with the same rules.`
                : `This will create a copy of "${duplicatingCollection?.name}" with all its videos.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (duplicatingCollection) {
                handleDuplicateCollection(duplicatingCollection);
                setDuplicatingCollection(null);
              }
            }}>
              Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Collection Dialog */}
      <Dialog open={createDialogOpen || !!editingCollection} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingCollection(null);
          setNewCollectionName("");
          setNewCollectionDescription("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollection ? "Edit Collection" : "Create New Collection"}</DialogTitle>
            <DialogDescription>
              {editingCollection ? "Update your collection details" : "Create a new playlist to organize your videos"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Favorites, Watch Later"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Add a description for this collection"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditingCollection(null);
                setNewCollectionName("");
                setNewCollectionDescription("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingCollection ? handleEditCollection : handleCreateCollection}>
              {editingCollection ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
