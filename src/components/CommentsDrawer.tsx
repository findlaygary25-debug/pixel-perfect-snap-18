import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ThumbsDown, Heart } from "lucide-react";

const commentSchema = z.object({
  comment_text: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters")
    .refine((val) => val.length > 0, "Comment cannot be empty"),
});

type Comment = {
  id: string;
  username: string;
  comment_text: string;
  created_at: string;
};

type CommentsDrawerProps = {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  onCommentAdded: () => void;
};

export default function CommentsDrawer({
  videoId,
  isOpen,
  onClose,
  commentCount,
  onCommentAdded,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [dislikedComments, setDislikedComments] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      checkUser();
    }
  }, [isOpen, videoId]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser({
        id: user.id,
        username: user.email?.split("@")[0] || "user",
      });
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      toast.error("Please login to comment");
      return;
    }

    // Validate input
    const validation = commentSchema.safeParse({
      comment_text: newComment,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid comment";
      toast.error(errorMessage);
      return;
    }

    setLoading(true);
    try {
      const sanitizedComment = validation.data.comment_text;

      const { error } = await supabase.from("comments").insert({
        video_id: videoId,
        user_id: currentUser.id,
        username: currentUser.username,
        comment_text: sanitizedComment,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      onCommentAdded();
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (commentId: string) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        toast.success("Like removed");
      } else {
        next.add(commentId);
        toast.success("Comment liked");
      }
      return next;
    });
  };

  const handleDislike = (commentId: string) => {
    setDislikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        toast.success("Dislike removed");
      } else {
        next.add(commentId);
        toast.success("Comment disliked");
      }
      return next;
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)]">
        <DrawerHeader>
          <DrawerTitle>Comments</DrawerTitle>
          <DrawerDescription>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 flex flex-col px-4 pb-4">
          <ScrollArea className="flex-1 pr-4 mb-4">
            {comments.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          @{comment.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(comment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              likedComments.has(comment.id) 
                                ? "fill-red-500 text-red-500" 
                                : "text-muted-foreground"
                            }`} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDislike(comment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <ThumbsDown 
                            className={`h-4 w-4 ${
                              dislikedComments.has(comment.id) 
                                ? "fill-destructive text-destructive" 
                                : "text-muted-foreground"
                            }`} 
                          />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none min-h-[40px]"
              rows={1}
            />
            <Button
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
