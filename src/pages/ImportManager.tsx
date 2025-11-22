import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Youtube, Edit, Trash2, Send, CheckCircle, XCircle, Loader2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

type ScheduledVideo = {
  id: string;
  user_id: string;
  youtube_video_id: string;
  youtube_title: string;
  youtube_description: string;
  youtube_thumbnail: string;
  youtube_channel: string;
  youtube_embed_url: string;
  scheduled_time: string;
  status: string;
  created_at: string;
  published_video_id: string | null;
};

type VideoChapter = {
  timestamp: number;
  label: string;
};

export default function ImportManager() {
  const [videos, setVideos] = useState<ScheduledVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<ScheduledVideo | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCaption, setEditedCaption] = useState("");
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Failed to load videos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (video: ScheduledVideo) => {
    setEditingVideo(video);
    setEditedTitle(video.youtube_title);
    setEditedCaption(`${video.youtube_title}\n\nSource: ${video.youtube_channel} on YouTube\n${video.youtube_description}`);
    setChapters([]);
  };

  const addChapter = () => {
    setChapters([...chapters, { timestamp: 0, label: "" }]);
  };

  const updateChapter = (index: number, field: 'timestamp' | 'label', value: string | number) => {
    const updated = [...chapters];
    if (field === 'timestamp') {
      updated[index].timestamp = value as number;
    } else {
      updated[index].label = value as string;
    }
    setChapters(updated);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const publishVideo = async (video: ScheduledVideo, immediate: boolean = false) => {
    setPublishing(video.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      // Insert video into main feed
      const { data: newVideo, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          username: profile?.username || 'Anonymous',
          video_url: editingVideo?.id === video.id ? video.youtube_embed_url : video.youtube_embed_url,
          caption: editingVideo?.id === video.id ? editedCaption : `${video.youtube_title}\n\nSource: ${video.youtube_channel} on YouTube\n${video.youtube_description}`,
          is_active: true,
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Add chapters if any
      if (editingVideo?.id === video.id && chapters.length > 0) {
        const chapterInserts = chapters
          .filter(ch => ch.label.trim() !== '')
          .map(ch => ({
            video_id: newVideo.id,
            user_id: user.id,
            timestamp: ch.timestamp,
            label: ch.label,
          }));

        if (chapterInserts.length > 0) {
          const { error: chaptersError } = await supabase
            .from('video_chapters')
            .insert(chapterInserts);

          if (chaptersError) {
            console.error('Error adding chapters:', chaptersError);
          }
        }
      }

      // Update scheduled video status
      const { error: updateError } = await supabase
        .from('scheduled_videos')
        .update({ 
          status: 'published',
          published_video_id: newVideo.id 
        })
        .eq('id', video.id);

      if (updateError) throw updateError;

      toast({
        title: "Video published!",
        description: immediate ? "Video is now live on your feed" : "Video published from schedule",
      });

      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Error publishing video:', error);
      toast({
        title: "Publishing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPublishing(null);
    }
  };

  const deleteVideo = async (videoId: string) => {
    setDeleting(videoId);
    try {
      const { error } = await supabase
        .from('scheduled_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video deleted",
        description: "The import has been removed",
      });

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const pendingVideos = videos.filter(v => v.status === 'pending');
  const publishedVideos = videos.filter(v => v.status === 'published');

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Manager</h1>
        <p className="text-muted-foreground mt-1">
          Transform and publish your YouTube imports to Voice2Fire
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingVideos.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedVideos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingVideos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending imports</p>
                <p className="text-sm mt-2">Import videos from the Import Videos page</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <img 
                      src={video.youtube_thumbnail} 
                      alt={video.youtube_title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {video.scheduled_time ? format(new Date(video.scheduled_time), "MMM d, h:mm a") : 'Pending'}
                    </Badge>
                  </div>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-2 text-sm">{video.youtube_title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{video.youtube_channel}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Imported {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditDialog(video)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Transform
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => publishVideo(video, true)}
                        disabled={publishing === video.id}
                      >
                        {publishing === video.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteVideo(video.id)}
                        disabled={deleting === video.id}
                      >
                        {deleting === video.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedVideos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No published videos yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden opacity-75">
                  <div className="relative">
                    <img 
                      src={video.youtube_thumbnail} 
                      alt={video.youtube_title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  </div>
                  <CardContent className="pt-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2 text-sm">{video.youtube_title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Published {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Transform Dialog */}
      {editingVideo && (
        <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Transform Video for Voice2Fire</DialogTitle>
              <DialogDescription>
                Optimize this YouTube import before publishing to your feed
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Preview */}
                <div className="relative">
                  <img 
                    src={editingVideo.youtube_thumbnail} 
                    alt={editingVideo.youtube_title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Badge className="absolute top-2 left-2">
                    <Youtube className="h-3 w-3 mr-1" />
                    {editingVideo.youtube_channel}
                  </Badge>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Video Title</Label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter video title"
                  />
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label>Caption / Description</Label>
                  <Textarea
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    placeholder="Enter caption for your video"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be displayed under your video on Voice2Fire
                  </p>
                </div>

                {/* Chapters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Video Chapters (Optional)</Label>
                    <Button size="sm" variant="outline" onClick={addChapter}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Chapter
                    </Button>
                  </div>
                  
                  {chapters.length > 0 && (
                    <div className="space-y-2 border rounded-lg p-3">
                      {chapters.map((chapter, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={chapter.timestamp}
                            onChange={(e) => updateChapter(index, 'timestamp', parseInt(e.target.value) || 0)}
                            className="w-24"
                            min="0"
                          />
                          <Input
                            placeholder="Chapter title"
                            value={chapter.label}
                            onChange={(e) => updateChapter(index, 'label', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeChapter(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add timestamps (in seconds) to create chapters for easier navigation
                  </p>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVideo(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => publishVideo(editingVideo, true)}
                disabled={publishing === editingVideo.id}
              >
                {publishing === editingVideo.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish to Feed
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
