import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, VideoOff, Mic, MicOff, Radio, StopCircle, Users, Image } from "lucide-react";
import { motion } from "framer-motion";
import LiveChat from "@/components/LiveChat";
import ViewerList from "@/components/ViewerList";

export default function Live() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>();
  const [streamImage, setStreamImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveStreamId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login to go live");
      navigate("/login");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser(session.user);

    // Get username and avatar
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", session.user.id)
      .single();
    
    setCurrentUsername(profileData?.username || 'Unknown');
    setCurrentAvatar(profileData?.avatar_url || undefined);
  };

  const startPreview = async () => {
    try {
      // Check if running on HTTPS or localhost
      if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
        toast.error("Camera access requires HTTPS connection");
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsPreparing(true);
      toast.success("Camera preview started");
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error("No camera found. Please connect a camera and try again.");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error("Camera is already in use by another application.");
      } else {
        toast.error("Failed to access camera. Please check permissions and try again.");
      }
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreparing(false);
  };

  const goLive = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your live stream");
      return;
    }

    try {
      // Get username from profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", currentUser.id)
        .single();

      // Create live stream record
      const { data, error } = await supabase
        .from("live_streams")
        .insert({
          user_id: currentUser.id,
          username: profileData?.username || 'Unknown',
          title,
          description,
          is_live: true,
          viewer_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      liveStreamId.current = data.id;
      setIsLive(true);
      toast.success("You're now live! 🎉");

      // Start viewer count updates
      startViewerCountUpdates();
    } catch (error) {
      console.error("Error starting live stream:", error);
      toast.error("Failed to start live stream");
    }
  };

  const endLive = async () => {
    if (!liveStreamId.current) return;

    try {
      await supabase
        .from("live_streams")
        .update({ is_live: false, ended_at: new Date().toISOString() })
        .eq("id", liveStreamId.current);

      stopPreview();
      setIsLive(false);
      toast.success("Live stream ended");
      navigate("/feed");
    } catch (error) {
      console.error("Error ending live stream:", error);
      toast.error("Failed to end live stream");
    }
  };

  const startViewerCountUpdates = () => {
    // Viewer count is now managed by ViewerList component
    return () => {};
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStreamImage(reader.result as string);
        toast.success("Image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleImageDisplay = () => {
    if (!streamImage) {
      toast.error("Please upload an image first");
      return;
    }
    setShowImage(!showImage);
    if (!showImage) {
      setCameraEnabled(false);
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = false;
      }
    } else {
      setCameraEnabled(true);
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = true;
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Go Live</h1>
        <p className="text-muted-foreground">
          Start broadcasting to your followers in real-time
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Video Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {isLive ? "You're live now!" : "Set up your stream before going live"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {showImage && streamImage ? (
                <img
                  src={streamImage}
                  alt="Stream display"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {!isPreparing && !isLive && !showImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Camera preview</p>
                  </div>
                </div>
              )}
              {isLive && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold"
                >
                  <Radio className="h-4 w-4" />
                  LIVE
                </motion.div>
              )}
              {isLive && (
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  {viewerCount}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={cameraEnabled && !showImage ? "default" : "destructive"}
                size="sm"
                onClick={toggleCamera}
                disabled={!isPreparing && !isLive || showImage}
              >
                {cameraEnabled && !showImage ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={micEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleMic}
                disabled={!isPreparing && !isLive}
              >
                {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              {streamImage && (
                <Button
                  variant={showImage ? "default" : "outline"}
                  size="sm"
                  onClick={toggleImageDisplay}
                  disabled={!isPreparing && !isLive}
                >
                  <Image className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stream Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Stream Details</CardTitle>
            <CardDescription>
              Add information about your live stream
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Give your stream a catchy title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLive}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell viewers what your stream is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLive}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-image">Stream Image (for audio-only)</Label>
              <Input
                ref={fileInputRef}
                id="stream-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLive}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Upload an image to show during voice-only streams (max 5MB)
              </p>
            </div>

            <div className="space-y-2 pt-4">
              {!isPreparing && !isLive && (
                <Button onClick={startPreview} className="w-full" size="lg">
                  <Video className="mr-2 h-5 w-5" />
                  Start Preview
                </Button>
              )}

              {isPreparing && !isLive && (
                <div className="space-y-2">
                  <Button onClick={goLive} className="w-full" size="lg">
                    <Radio className="mr-2 h-5 w-5" />
                    Go Live
                  </Button>
                  <Button onClick={stopPreview} variant="outline" className="w-full">
                    Cancel
                  </Button>
                </div>
              )}

              {isLive && (
                <Button onClick={endLive} variant="destructive" className="w-full" size="lg">
                  <StopCircle className="mr-2 h-5 w-5" />
                  End Stream
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Chat and Viewer List */}
        {isLive && liveStreamId.current && (
          <div className="flex flex-col gap-6">
            <Card className="h-[350px]">
              <ViewerList 
                liveStreamId={liveStreamId.current}
                currentUserId={currentUser.id}
                currentUsername={currentUsername}
                currentAvatar={currentAvatar}
                onViewerCountChange={setViewerCount}
              />
            </Card>
            <Card className="h-[350px]">
              <LiveChat 
                liveStreamId={liveStreamId.current}
                currentUserId={currentUser.id}
                currentUsername={currentUsername}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
