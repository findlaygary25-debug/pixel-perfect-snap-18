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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Send, ThumbsDown, Heart, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  user_id: string;
  comment_text: string;
  created_at: string;
};

type CommentsDrawerProps = {
  videoId: string;
  videoCreatorId?: string;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  onCommentAdded: () => void;
};

export default function CommentsDrawer({
  videoId,
  videoCreatorId,
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
        .select("id, username, user_id, comment_text, created_at")
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
    <DrawerContent
      className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] md:h-[80vh] md:max-h-[80vh] md:bottom-6 md:right-6 md:inset-x-auto md:w-full md:max-w-md md:rounded-2xl md:mt-0"
    >
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
              <div className="space-y-6">
                {comments.map((comment) => {
                  const isCreator = videoCreatorId && comment.user_id === videoCreatorId;
                  const likeCount = likedComments.has(comment.id) ? 1 : 0;
                  
                  return (
                    <div key={comment.id} className="flex gap-3">
                      {/* Avatar - 40px */}
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} />
                          <AvatarFallback className="text-xs">
                            {comment.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isCreator && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-[10px] w-[10px] rounded-full border border-background bg-background flex items-center justify-center">
                            <Heart className="h-2 w-2 fill-red-500 text-red-500" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">
                              {comment.username}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Report</DropdownMenuItem>
                              {currentUser?.id === comment.user_id && (
                                <DropdownMenuItem className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Comment Text */}
                        <p className="text-sm mb-2 break-words">{comment.comment_text}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="text-xs">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }).replace('about ', '')}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs font-medium hover:bg-transparent"
                          >
                            Reply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(comment.id)}
                            className="h-auto p-0 flex items-center gap-1 hover:bg-transparent"
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                likedComments.has(comment.id) 
                                  ? "fill-red-500 text-red-500" 
                                  : ""
                              }`} 
                            />
                            {likeCount > 0 && (
                              <span className="text-xs">{likeCount}</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
