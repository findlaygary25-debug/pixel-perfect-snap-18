import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, Trash2, Play } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type CollectionVideo = {
  id: string;
  video_id: string;
  order_index: number;
  videos: {
    id: string;
    video_url: string;
    caption: string | null;
    username: string;
    likes: number;
    views: number;
  };
};

function SortableVideoCard({ item, onRemove }: { item: CollectionVideo; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'shadow-2xl' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <button
              className="cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <video
                src={item.videos.video_url}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-2">
                {item.videos.caption || `Video by ${item.videos.username}`}
              </p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>@{item.videos.username}</span>
                <span>❤️ {item.videos.likes}</span>
                <span>👁️ {item.videos.views}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      fetchCollection();
      fetchVideos();
    }
  }, [id]);

  const fetchCollection = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCollection(data);
    } catch (error) {
      console.error("Error fetching collection:", error);
      toast.error("Failed to load collection");
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("collection_items")
        .select(`
          id,
          video_id,
          order_index,
          videos (
            id,
            video_url,
            caption,
            username,
            likes,
            views
          )
        `)
        .eq("collection_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setVideos((data as any) || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);

    const newVideos = arrayMove(videos, oldIndex, newIndex);
    setVideos(newVideos);

    // Update order in database
    try {
      const updates = newVideos.map((video, index) => ({
        id: video.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from("collection_items")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      toast.success("Video order updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
      fetchVideos(); // Revert on error
    }
  };

  const handleRemoveVideo = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("collection_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Video removed from collection");
      fetchVideos();
    } catch (error) {
      console.error("Error removing video:", error);
      toast.error("Failed to remove video");
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/collections")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{collection?.name}</h1>
          {collection?.description && (
            <p className="text-muted-foreground mt-1">{collection.description}</p>
          )}
        </div>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos in this collection</h3>
            <p className="text-muted-foreground mb-4">
              Add videos to this collection from the video feed
            </p>
            <Button onClick={() => navigate("/feed")}>
              Browse Videos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {videos.length} video{videos.length !== 1 ? 's' : ''} • Drag to reorder
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={videos.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              {videos.map((item) => (
                <SortableVideoCard
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemoveVideo(item.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
