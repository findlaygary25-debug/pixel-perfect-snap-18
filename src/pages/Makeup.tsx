import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Radio, 
  StopCircle, 
  Users,
  Lightbulb,
  Sun,
  Zap,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LiveChat from "@/components/LiveChat";
import ViewerList from "@/components/ViewerList";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Makeup() {
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
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveStreamId = useRef<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    }
  }, [brightness, contrast, saturation]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login to access the Makeup Room");
      navigate("/login");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser(session.user);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user"
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsPreparing(true);
      toast.success("Camera preview started - Check your lighting!");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
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
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
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

  const goLive = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your makeup session");
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", currentUser.id)
        .single();

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
      toast.success("You're now live in the Makeup Room!");
    } catch (error) {
      console.error("Error going live:", error);
      toast.error("Failed to start live stream");
    }
  };

  const endStream = async () => {
    if (!liveStreamId.current) return;

    try {
      await supabase
        .from("live_streams")
        .update({
          is_live: false,
          ended_at: new Date().toISOString()
        })
        .eq("id", liveStreamId.current);

      stopPreview();
      setIsLive(false);
      toast.success("Live stream ended");
      liveStreamId.current = null;
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream");
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    toast.success("Filters reset to default");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Makeup Room
            </h1>
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Professional lighting setup for your makeup tutorials and sessions
          </p>
        </motion.div>

        {!isPreparing && !isLive ? (
          /* Setup View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Setup Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Start Your Session</CardTitle>
                <CardDescription>
                  Set up your makeup room and check your lighting before going live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Evening Glam Makeup Tutorial"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What will you be demonstrating today?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={startPreview} className="w-full" size="lg">
                  <Video className="mr-2 h-5 w-5" />
                  Start Camera Preview
                </Button>
              </CardContent>
            </Card>

            {/* Lighting Tips Card */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-primary" />
                  Lighting Tips
                </CardTitle>
                <CardDescription>
                  Essential tips for perfect makeup filming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-lg bg-background/60 border">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Use Ring Light</p>
                      <p className="text-xs text-muted-foreground">
                        Position a ring light in front for even, flattering illumination
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-lg bg-background/60 border">
                    <Sun className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Natural Light</p>
                      <p className="text-xs text-muted-foreground">
                        Face a window for soft, natural lighting (avoid direct sunlight)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-lg bg-background/60 border">
                    <Settings className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Color Temperature</p>
                      <p className="text-xs text-muted-foreground">
                        Use daylight bulbs (5500K-6500K) for accurate color representation
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Checklist:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Camera at eye level</li>
                    <li>Clean, uncluttered background</li>
                    <li>Test audio quality</li>
                    <li>Check makeup in camera preview</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Live/Preview View */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Video Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-2 overflow-hidden">
                <CardContent className="p-0 relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Video Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <div className="flex items-end justify-between">
                      <div className="space-y-2">
                        {isLive && (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="animate-pulse">
                                <Radio className="h-3 w-3 mr-1" />
                                LIVE
                              </Badge>
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {viewerCount}
                              </Badge>
                            </div>
                            <h3 className="text-white font-semibold">{title}</h3>
                          </>
                        )}
                        {isPreparing && !isLive && (
                          <Badge variant="secondary">Preview Mode</Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant={cameraEnabled ? "secondary" : "destructive"}
                          onClick={toggleCamera}
                        >
                          {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant={micEnabled ? "secondary" : "destructive"}
                          onClick={toggleMic}
                        >
                          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Video Controls */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Video Settings</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showSettings ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Brightness</Label>
                            <span className="text-sm text-muted-foreground">{brightness}%</span>
                          </div>
                          <Slider
                            value={[brightness]}
                            onValueChange={(v) => setBrightness(v[0])}
                            min={50}
                            max={150}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Contrast</Label>
                            <span className="text-sm text-muted-foreground">{contrast}%</span>
                          </div>
                          <Slider
                            value={[contrast]}
                            onValueChange={(v) => setContrast(v[0])}
                            min={50}
                            max={150}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Saturation</Label>
                            <span className="text-sm text-muted-foreground">{saturation}%</span>
                          </div>
                          <Slider
                            value={[saturation]}
                            onValueChange={(v) => setSaturation(v[0])}
                            min={50}
                            max={150}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <Button onClick={resetFilters} variant="outline" className="w-full">
                          Reset to Default
                        </Button>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isLive ? (
                  <>
                    <Button onClick={goLive} size="lg" className="flex-1">
                      <Radio className="mr-2 h-5 w-5" />
                      Go Live
                    </Button>
                    <Button onClick={stopPreview} variant="outline" size="lg">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={endStream} variant="destructive" size="lg" className="w-full">
                    <StopCircle className="mr-2 h-5 w-5" />
                    End Stream
                  </Button>
                )}
              </div>
            </div>

            {/* Chat and Viewers Sidebar */}
            {isLive && (
              <div className="space-y-4">
                <div className="h-[400px]">
                  <LiveChat
                    liveStreamId={liveStreamId.current!}
                    currentUserId={currentUser.id}
                    currentUsername={currentUsername}
                  />
                </div>
                <div className="h-[300px]">
                  <ViewerList
                    liveStreamId={liveStreamId.current!}
                    currentUserId={currentUser.id}
                    currentUsername={currentUsername}
                    currentAvatar={currentAvatar}
                    onViewerCountChange={setViewerCount}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
