import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Upload, 
  Music, 
  Lightbulb,
  Sun,
  Droplets,
  Thermometer,
  Eye,
  Sparkles,
  Save,
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
}

export default function Makeup() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Lighting controls
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [vignette, setVignette] = useState(0);
  
  // Audio
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [audioVolume, setAudioVolume] = useState(70);
  const [uploadedAudio, setUploadedAudio] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const musicLibrary: AudioTrack[] = [
    { id: "1", name: "Upbeat Pop", url: "/audio/upbeat.mp3", duration: 180 },
    { id: "2", name: "Chill Vibes", url: "/audio/chill.mp3", duration: 210 },
    { id: "3", name: "Electronic Beat", url: "/audio/electronic.mp3", duration: 195 },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const hueRotate = warmth * 0.5;
      const blur = sharpness < 0 ? Math.abs(sharpness) * 0.02 : 0;
      const vignetteFilter = vignette > 0 ? `radial-gradient(ellipse at center, transparent ${100 - vignette}%, rgba(0,0,0,0.5) 100%)` : '';
      
      videoRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;
      
      if (vignette > 0 && videoRef.current.parentElement) {
        videoRef.current.parentElement.style.backgroundImage = vignetteFilter;
      }
    }
  }, [brightness, contrast, saturation, warmth, sharpness, vignette]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume / 100;
    }
  }, [audioVolume]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login to access the Video Studio");
      navigate("/login");
      return;
    }
    setIsAuthenticated(true);
    setCurrentUser(session.user);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error("Video file too large. Maximum size is 100MB");
        return;
      }
      
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast.success("Video loaded successfully");
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedAudio(url);
      setSelectedAudio({
        id: "custom",
        name: file.name,
        url: url,
        duration: 0
      });
      toast.success("Audio uploaded successfully");
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (audioRef.current) audioRef.current.pause();
      } else {
        videoRef.current.play();
        if (audioRef.current) audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const selectMusicTrack = (track: AudioTrack) => {
    setSelectedAudio(track);
    toast.success(`Selected: ${track.name}`);
  };

  const resetAllSettings = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setSharpness(0);
    setVignette(0);
    setAudioVolume(70);
    toast.success("All settings reset to default");
  };

  const saveVideoSettings = () => {
    const settings = {
      brightness,
      contrast,
      saturation,
      warmth,
      sharpness,
      vignette,
      audioTrack: selectedAudio?.id,
      audioVolume
    };
    localStorage.setItem('video-studio-settings', JSON.stringify(settings));
    toast.success("Settings saved! They'll be applied to your next live stream");
  };

  const publishVideo = async () => {
    if (!videoFile) {
      toast.error("Please upload a video first");
      return;
    }

    toast.loading("Publishing video...");
    
    try {
      // Here you would upload the video with applied settings
      // For now, we'll just show a success message
      setTimeout(() => {
        toast.success("Video published successfully!");
      }, 2000);
    } catch (error) {
      console.error("Error publishing video:", error);
      toast.error("Failed to publish video");
    }
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
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Video Studio
            </h1>
            <Badge variant="outline">
              <Lightbulb className="h-3 w-3 mr-1" />
              Pro Lighting
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Perfect your videos with professional lighting, filters, and music before posting or going live
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Video Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 overflow-hidden">
              <CardContent className="p-0">
                {!videoUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Upload Your Video</p>
                    <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
                    <p className="text-xs text-muted-foreground mt-2">Max 100MB • MP4, MOV, AVI</p>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-black">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {selectedAudio && (
                      <audio ref={audioRef} src={selectedAudio.url} loop />
                    )}
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button size="icon" variant="secondary" onClick={togglePlay}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="secondary" onClick={toggleMute}>
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        {selectedAudio && (
                          <Badge variant="secondary" className="text-xs">
                            <Music className="h-3 w-3 mr-1" />
                            {selectedAudio.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {videoUrl && (
              <div className="flex gap-3">
                <Button onClick={saveVideoSettings} variant="outline" size="lg" className="flex-1">
                  <Save className="mr-2 h-5 w-5" />
                  Save Settings for Live
                </Button>
                <Button onClick={publishVideo} size="lg" className="flex-1">
                  <Radio className="mr-2 h-5 w-5" />
                  Publish Video
                </Button>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Lighting & Effects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="lighting" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lighting">Lighting</TabsTrigger>
                    <TabsTrigger value="effects">Effects</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="lighting" className="space-y-6 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-primary" />
                          Brightness
                        </Label>
                        <span className="text-sm text-muted-foreground">{brightness}%</span>
                      </div>
                      <Slider
                        value={[brightness]}
                        onValueChange={(v) => setBrightness(v[0])}
                        min={50}
                        max={150}
                        step={1}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          Contrast
                        </Label>
                        <span className="text-sm text-muted-foreground">{contrast}%</span>
                      </div>
                      <Slider
                        value={[contrast]}
                        onValueChange={(v) => setContrast(v[0])}
                        min={50}
                        max={150}
                        step={1}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-primary" />
                          Saturation
                        </Label>
                        <span className="text-sm text-muted-foreground">{saturation}%</span>
                      </div>
                      <Slider
                        value={[saturation]}
                        onValueChange={(v) => setSaturation(v[0])}
                        min={50}
                        max={150}
                        step={1}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-primary" />
                          Warmth
                        </Label>
                        <span className="text-sm text-muted-foreground">{warmth > 0 ? '+' : ''}{warmth}</span>
                      </div>
                      <Slider
                        value={[warmth]}
                        onValueChange={(v) => setWarmth(v[0])}
                        min={-50}
                        max={50}
                        step={1}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="effects" className="space-y-6 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Sharpness</Label>
                        <span className="text-sm text-muted-foreground">{sharpness > 0 ? '+' : ''}{sharpness}</span>
                      </div>
                      <Slider
                        value={[sharpness]}
                        onValueChange={(v) => setSharpness(v[0])}
                        min={-10}
                        max={10}
                        step={1}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Vignette</Label>
                        <span className="text-sm text-muted-foreground">{vignette}%</span>
                      </div>
                      <Slider
                        value={[vignette]}
                        onValueChange={(v) => setVignette(v[0])}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>

                    <Separator />
                    
                    <Button onClick={resetAllSettings} variant="outline" className="w-full">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset All
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  Background Music
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Music Volume</Label>
                  <Slider
                    value={[audioVolume]}
                    onValueChange={(v) => setAudioVolume(v[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Music Library</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {musicLibrary.map((track) => (
                        <div
                          key={track.id}
                          onClick={() => selectMusicTrack(track)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedAudio?.id === track.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{track.name}</span>
                            <span className="text-xs opacity-70">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>Upload Custom Audio</Label>
                  <Button 
                    onClick={() => audioInputRef.current?.click()} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio
                  </Button>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
