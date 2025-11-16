import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus, UserMinus, TrendingUp, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles, Settings, X, PictureInPicture, ListVideo, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import CommentsDrawer from "@/components/CommentsDrawer";
import { PromotePostDialog } from "@/components/PromotePostDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoSchema } from "@/components/VideoSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { SocialShareDialog } from "@/components/SocialShareDialog";
import { OpenGraphTags } from "@/components/OpenGraphTags";

type VideoPost = {
  id: string;
  video_url: string;
  video_url_360p?: string | null;
  video_url_480p?: string | null;
  video_url_720p?: string | null;
  video_url_1080p?: string | null;
  caption: string;
  username: string;
  user_id: string;
  likes: number;
  views: number;
  comments?: number;
  avatar_url?: string | null;
};

type VideoChapter = {
  id: string;
  video_id: string;
  user_id: string;
  timestamp: number;
  label: string;
  created_at: string;
};

export default function Feed() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [followingVideos, setFollowingVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("forYou");
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedPromoteVideo, setSelectedPromoteVideo] = useState<VideoPost | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedShareVideo, setSelectedShareVideo] = useState<VideoPost | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [doubleTapHearts, setDoubleTapHearts] = useState<Set<string>>(new Set());
  const lastTapRef = useRef<{ videoId: string; time: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, { current: number; duration: number; buffered: number }>>({});
  const [hoveredProgress, setHoveredProgress] = useState<{ videoId: string; percentage: number; x: number; thumbnail: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentVisibleVideoId, setCurrentVisibleVideoId] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [fullscreenVideoId, setFullscreenVideoId] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState<Set<string>>(new Set());
  const [captionTextSize, setCaptionTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [captionBackground, setCaptionBackground] = useState<'none' | 'semi' | 'solid'>('semi');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [miniPlayerVideo, setMiniPlayerVideo] = useState<{ video: VideoPost; wasPlaying: boolean } | null>(null);
  const videoContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [videoQuality, setVideoQuality] = useState<'auto' | '360p' | '480p' | '720p' | '1080p'>('auto');
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [autoQualityEnabled, setAutoQualityEnabled] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<'360p' | '480p' | '720p' | '1080p'>('720p');
  const [pipVideo, setPipVideo] = useState<string | null>(null);
  const [videoChapters, setVideoChapters] = useState<Record<string, VideoChapter[]>>({});
  const [chaptersDialogOpen, setChaptersDialogOpen] = useState(false);
  const [selectedChapterVideo, setSelectedChapterVideo] = useState<VideoPost | null>(null);
  const [newChapterLabel, setNewChapterLabel] = useState("");
  const [editingChapter, setEditingChapter] = useState<VideoChapter | null>(null);
  const [showChaptersList, setShowChaptersList] = useState<Set<string>>(new Set());
  
  // Adaptive bitrate streaming state
  const [activeQuality, setActiveQuality] = useState<Record<string, '360p' | '480p' | '720p' | '1080p'>>({});
  const [bufferHealth, setBufferHealth] = useState<Record<string, number>>({});
  const abrCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Enhanced haptic feedback helper with custom patterns
  const triggerHaptic = async (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'notification' | 'achievement' = 'light') => {
    try {
      switch (pattern) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          // Success notification for achievements
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'achievement':
          // Strong pattern for achievements: heavy impact + success
          await Haptics.impact({ style: ImpactStyle.Heavy });
          setTimeout(async () => {
            await Haptics.notification({ type: NotificationType.Success });
          }, 100);
          break;
        case 'notification':
          // Subtle pulse pattern for notifications
          await Haptics.vibrate({ duration: 50 });
          setTimeout(async () => {
            await Haptics.vibrate({ duration: 30 });
          }, 100);
          break;
      }
    } catch (error) {
      // Haptics not supported on this device/browser, fail silently
      console.debug('Haptics not available');
    }
  };

  // Network speed detection
  useEffect(() => {
    const detectNetworkSpeed = () => {
      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === '4g') {
          setNetworkSpeed('fast');
          if (autoQualityEnabled) setCurrentQuality('1080p');
        } else if (effectiveType === '3g') {
          setNetworkSpeed('medium');
          if (autoQualityEnabled) setCurrentQuality('720p');
        } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setNetworkSpeed('slow');
          if (autoQualityEnabled) setCurrentQuality('480p');
        } else {
          setNetworkSpeed('medium');
          if (autoQualityEnabled) setCurrentQuality('720p');
        }
        
        // Also check downlink speed if available
        if (connection.downlink) {
          const mbps = connection.downlink;
          if (mbps >= 5) {
            setNetworkSpeed('fast');
            if (autoQualityEnabled) setCurrentQuality('1080p');
          } else if (mbps >= 1.5) {
            setNetworkSpeed('medium');
            if (autoQualityEnabled) setCurrentQuality('720p');
          } else {
            setNetworkSpeed('slow');
            if (autoQualityEnabled) setCurrentQuality('480p');
          }
        }
      } else {
        // Fallback: detect based on device performance
        const memory = (navigator as any).deviceMemory;
        const cores = navigator.hardwareConcurrency;
        
        if (memory >= 8 && cores >= 4) {
          setNetworkSpeed('fast');
          if (autoQualityEnabled) setCurrentQuality('1080p');
        } else if (memory >= 4 || cores >= 2) {
          setNetworkSpeed('medium');
          if (autoQualityEnabled) setCurrentQuality('720p');
        } else {
          setNetworkSpeed('slow');
          if (autoQualityEnabled) setCurrentQuality('480p');
        }
      }
    };

    detectNetworkSpeed();

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', detectNetworkSpeed);
      return () => connection.removeEventListener('change', detectNetworkSpeed);
    }
  }, [autoQualityEnabled]);

  // Update quality when manual selection changes
  useEffect(() => {
    if (videoQuality === 'auto') {
      setAutoQualityEnabled(true);
    } else {
      setAutoQualityEnabled(false);
      setCurrentQuality(videoQuality);
    }
  }, [videoQuality]);

  // Adaptive Bitrate Streaming (ABR) - Monitor buffer health and switch quality
  useEffect(() => {
    // Helper function to get available qualities for a video
    const getAvailableQualities = (video: VideoPost): Array<'360p' | '480p' | '720p' | '1080p'> => {
      const qualities: Array<'360p' | '480p' | '720p' | '1080p'> = [];
      if (video.video_url_360p) qualities.push('360p');
      if (video.video_url_480p) qualities.push('480p');
      if (video.video_url_720p) qualities.push('720p');
      if (video.video_url_1080p) qualities.push('1080p');
      return qualities;
    };

    // Helper function to get video URL for quality
    const getQualityUrl = (video: VideoPost, quality: '360p' | '480p' | '720p' | '1080p'): string => {
      switch (quality) {
        case '360p': return video.video_url_360p || video.video_url;
        case '480p': return video.video_url_480p || video.video_url;
        case '720p': return video.video_url_720p || video.video_url;
        case '1080p': return video.video_url_1080p || video.video_url;
        default: return video.video_url;
      }
    };

    // Helper function to determine ideal quality based on buffer and network
    const calculateIdealQuality = (
      bufferSeconds: number,
      currentQualityLevel: '360p' | '480p' | '720p' | '1080p',
      availableQualities: Array<'360p' | '480p' | '720p' | '1080p'>
    ): '360p' | '480p' | '720p' | '1080p' => {
      const qualityLevels = { '360p': 1, '480p': 2, '720p': 3, '1080p': 4 };
      const currentLevel = qualityLevels[currentQualityLevel];

      // Critical buffer (< 2 seconds): drop quality aggressively
      if (bufferSeconds < 2) {
        const lowerQualities = availableQualities.filter(q => qualityLevels[q] < currentLevel);
        return lowerQualities[0] || availableQualities[0];
      }
      
      // Low buffer (2-5 seconds): drop one level if possible
      if (bufferSeconds < 5 && bufferSeconds >= 2) {
        const oneLevelDown = Object.entries(qualityLevels).find(
          ([_, level]) => level === currentLevel - 1
        )?.[0] as '360p' | '480p' | '720p' | '1080p' | undefined;
        if (oneLevelDown && availableQualities.includes(oneLevelDown)) {
          return oneLevelDown;
        }
        return currentQualityLevel;
      }

      // Good buffer (5-10 seconds): maintain or upgrade slightly
      if (bufferSeconds >= 5 && bufferSeconds < 10) {
        // Network-based upgrade decision
        if (networkSpeed === 'fast' && currentLevel < 4) {
          const oneLevelUp = Object.entries(qualityLevels).find(
            ([_, level]) => level === currentLevel + 1
          )?.[0] as '360p' | '480p' | '720p' | '1080p' | undefined;
          if (oneLevelUp && availableQualities.includes(oneLevelUp)) {
            return oneLevelUp;
          }
        }
        return currentQualityLevel;
      }

      // Excellent buffer (>= 10 seconds): upgrade to best available for network
      if (bufferSeconds >= 10) {
        const targetQuality = networkSpeed === 'fast' ? '1080p' 
                            : networkSpeed === 'medium' ? '720p' 
                            : '480p';
        
        if (availableQualities.includes(targetQuality)) {
          return targetQuality;
        }
        
        // Fallback to highest available
        return availableQualities[availableQualities.length - 1];
      }

      return currentQualityLevel;
    };

    // ABR monitoring loop
    const checkBufferHealth = () => {
      if (!autoQualityEnabled || videoQuality !== 'auto') return;

      const currentVideos = activeTab === "following" ? followingVideos : videos;
      
      currentVideos.forEach(video => {
        const videoElement = videoRefs.current.get(video.id);
        if (!videoElement || videoElement.paused) return;

        const availableQualities = getAvailableQualities(video);
        if (availableQualities.length === 0) return; // No quality variants available

        // Calculate buffer health
        const buffered = videoElement.buffered;
        let bufferSeconds = 0;
        
        if (buffered.length > 0) {
          const currentTime = videoElement.currentTime;
          // Find the buffered range that contains current playback position
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
              bufferSeconds = buffered.end(i) - currentTime;
              break;
            }
          }
        }

        // Update buffer health state
        setBufferHealth(prev => ({ ...prev, [video.id]: bufferSeconds }));

        // Get current active quality or initialize with default
        const currentActiveQuality = activeQuality[video.id] || 
          (networkSpeed === 'fast' ? '1080p' : networkSpeed === 'medium' ? '720p' : '480p');

        // Calculate ideal quality
        const idealQuality = calculateIdealQuality(bufferSeconds, currentActiveQuality, availableQualities);

        // Switch quality if different and not already at the ideal
        if (idealQuality !== currentActiveQuality) {
          const newUrl = getQualityUrl(video, idealQuality);
          const currentTime = videoElement.currentTime;
          const wasPlaying = !videoElement.paused;

          console.log(`[ABR] Switching ${video.id} from ${currentActiveQuality} to ${idealQuality} (buffer: ${bufferSeconds.toFixed(1)}s)`);

          // Smoothly transition to new quality
          videoElement.src = newUrl;
          videoElement.currentTime = currentTime;
          
          if (wasPlaying) {
            videoElement.play().catch(err => console.error('ABR play error:', err));
          }

          // Update active quality
          setActiveQuality(prev => ({ ...prev, [video.id]: idealQuality }));
          
          // Show toast notification for quality change
          toast.info(`Video quality: ${idealQuality}`, { duration: 2000 });
        }
      });
    };

    // Start monitoring
    if (autoQualityEnabled && videoQuality === 'auto') {
      abrCheckInterval.current = setInterval(checkBufferHealth, 2000); // Check every 2 seconds
    }

    return () => {
      if (abrCheckInterval.current) {
        clearInterval(abrCheckInterval.current);
        abrCheckInterval.current = null;
      }
    };
  }, [videos, followingVideos, activeTab, autoQualityEnabled, videoQuality, networkSpeed, activeQuality]);

  // Auto-play videos when they come into view (mobile) + mini player
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Video must be 50% visible
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        const videoId = video.dataset.videoId;
        
        if (entry.isIntersecting) {
          // Track currently visible video
          if (videoId) {
            setCurrentVisibleVideoId(videoId);
            // Close mini player if scrolling back to the video
            setMiniPlayerVideo((prev) => {
              if (prev && prev.video.id === videoId) {
                return null;
              }
              return prev;
            });
          }
          
          video.play().then(() => {
            if (videoId) {
              setPlayingVideos((prev) => new Set(prev).add(videoId));
            }
          }).catch(() => {
            if (videoId) {
              setPlayingVideos((prev) => {
                const newSet = new Set(prev);
                newSet.delete(videoId);
                return newSet;
              });
            }
          });
        } else {
          // Check if video was playing before pausing
          const wasPlaying = !video.paused;
          video.pause();
          if (videoId) {
            setPlayingVideos((prev) => {
              const newSet = new Set(prev);
              newSet.delete(videoId);
              return newSet;
            });
            
            // Show mini player if video was playing and scrolled away
            if (wasPlaying && !miniPlayerVideo) {
              const currentVideos = activeTab === "following" ? followingVideos : videos;
              const videoData = currentVideos.find(v => v.id === videoId);
              if (videoData) {
                setMiniPlayerVideo({ video: videoData, wasPlaying: true });
              }
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all video elements
    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [videos, followingVideos, activeTab, miniPlayerVideo]);

  // Smart video preloading - preload next 2-3 videos based on current visible video
  useEffect(() => {
    const currentVideos = activeTab === "following" ? followingVideos : videos;
    if (currentVideos.length === 0 || !currentVisibleVideoId) return;
    
    const currentIndex = currentVideos.findIndex(v => v.id === currentVisibleVideoId);
    if (currentIndex === -1) return;
    
    // Determine how many videos to preload based on network speed
    const preloadCount = networkSpeed === 'fast' ? 3 : networkSpeed === 'medium' ? 2 : 1;
    
    // Preload current + next videos
    for (let i = currentIndex; i <= currentIndex + preloadCount && i < currentVideos.length; i++) {
      const videoId = currentVideos[i].id;
      const videoElement = videoRefs.current.get(videoId);
      
      if (videoElement) {
        // Set preload to 'auto' for current and next videos
        if (i === currentIndex) {
          videoElement.preload = 'auto';
        } else {
          // For upcoming videos, use 'metadata' on slow connections, 'auto' on fast
          videoElement.preload = networkSpeed === 'slow' ? 'metadata' : 'auto';
        }
        
        // Trigger load if not already loading
        if (videoElement.readyState < 2) {
          videoElement.load();
        }
      }
    }
    
    // Clean up: set videos far behind to preload='none' to save bandwidth
    for (let i = 0; i < currentIndex - 1; i++) {
      const videoId = currentVideos[i]?.id;
      const videoElement = videoRefs.current.get(videoId);
      if (videoElement) {
        videoElement.preload = 'none';
      }
    }
    
    // Clean up: set videos far ahead to preload='none' to save bandwidth
    for (let i = currentIndex + preloadCount + 1; i < currentVideos.length; i++) {
      const videoId = currentVideos[i]?.id;
      const videoElement = videoRefs.current.get(videoId);
      if (videoElement) {
        videoElement.preload = 'none';
      }
    }
  }, [currentVisibleVideoId, videos, followingVideos, activeTab, networkSpeed]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenVideoId(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts for video control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle "?" to show shortcuts overlay
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }
      
      // Handle Escape to close shortcuts overlay
      if (e.key === 'Escape' && showShortcuts) {
        e.preventDefault();
        setShowShortcuts(false);
        return;
      }
      
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!currentVisibleVideoId) return;
      
      const videoElement = videoRefs.current.get(currentVisibleVideoId);
      if (!videoElement) return;
      
      const currentVideos = activeTab === "following" ? followingVideos : videos;
      const currentIndex = currentVideos.findIndex(v => v.id === currentVisibleVideoId);

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          triggerHaptic('light');
          if (videoElement.paused) {
            videoElement.play();
            setPlayingVideos((prev) => new Set(prev).add(currentVisibleVideoId));
            toast.success('Playing', { duration: 1000 });
          } else {
            videoElement.pause();
            setPlayingVideos((prev) => {
              const next = new Set(prev);
              next.delete(currentVisibleVideoId);
              return next;
            });
            toast.success('Paused', { duration: 1000 });
          }
          break;
        
        case 'KeyM':
          e.preventDefault();
          setMutedVideos((prev) => {
            const next = new Set(prev);
            if (next.has(currentVisibleVideoId)) {
              next.delete(currentVisibleVideoId);
              videoElement.muted = false;
              toast.success('Unmuted', { duration: 1000 });
            } else {
              next.add(currentVisibleVideoId);
              videoElement.muted = true;
              toast.success('Muted', { duration: 1000 });
            }
            return next;
          });
          break;
        
        case 'KeyF':
          e.preventDefault();
          const videoContainer = videoElement.parentElement;
          if (!videoContainer) return;
          
          if (fullscreenVideoId === currentVisibleVideoId) {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
            setFullscreenVideoId(null);
            toast.success('Exited fullscreen', { duration: 1000 });
          } else {
            if (videoContainer.requestFullscreen) {
              videoContainer.requestFullscreen();
            }
            setFullscreenVideoId(currentVisibleVideoId);
            toast.success('Fullscreen mode', { duration: 1000 });
          }
          break;
        
        case 'ArrowLeft':
          e.preventDefault();
          videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
          toast.success('Rewind 5s', { duration: 1000 });
          break;
        
        case 'ArrowRight':
          e.preventDefault();
          videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 5);
          toast.success('Forward 5s', { duration: 1000 });
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          // Navigate to previous video
          if (currentIndex > 0) {
            const prevVideo = currentVideos[currentIndex - 1];
            const prevContainer = videoContainerRefs.current.get(prevVideo.id);
            if (prevContainer) {
              prevContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
              toast.success('Previous video', { duration: 1000 });
            }
          }
          break;
        
        case 'ArrowDown':
          e.preventDefault();
          // Navigate to next video
          if (currentIndex < currentVideos.length - 1) {
            const nextVideo = currentVideos[currentIndex + 1];
            const nextContainer = videoContainerRefs.current.get(nextVideo.id);
            if (nextContainer) {
              nextContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
              toast.success('Next video', { duration: 1000 });
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVisibleVideoId, showShortcuts, playingVideos, fullscreenVideoId, mutedVideos, videos, followingVideos, activeTab]);

  const setVideoRef = useCallback((videoId: string, element: HTMLVideoElement | null) => {
    if (element) {
      videoRefs.current.set(videoId, element);
      
      // Add event listeners for progress tracking
      const handleTimeUpdate = () => {
        setVideoProgress(prev => ({
          ...prev,
          [videoId]: {
            current: element.currentTime,
            duration: element.duration,
            buffered: element.buffered.length > 0 ? element.buffered.end(element.buffered.length - 1) : 0
          }
        }));
      };
      
      const handleProgress = () => {
        if (element.buffered.length > 0) {
          setVideoProgress(prev => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              buffered: element.buffered.end(element.buffered.length - 1)
            }
          }));
        }
      };
      
      const handleLoadedMetadata = () => {
        setVideoProgress(prev => ({
          ...prev,
          [videoId]: {
            current: 0,
            duration: element.duration,
            buffered: 0
          }
        }));
      };
      
      element.addEventListener('timeupdate', handleTimeUpdate);
      element.addEventListener('progress', handleProgress);
      element.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Store cleanup function
      (element as any)._cleanup = () => {
        element.removeEventListener('timeupdate', handleTimeUpdate);
        element.removeEventListener('progress', handleProgress);
        element.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    } else {
      const video = videoRefs.current.get(videoId);
      if (video && (video as any)._cleanup) {
        (video as any)._cleanup();
      }
      videoRefs.current.delete(videoId);
    }
  }, []);

  const handleDoubleTap = async (videoId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap && lastTap.videoId === videoId && now - lastTap.time < 300) {
      // Double tap detected
      lastTapRef.current = null;
      
      // Trigger haptic feedback
      await triggerHaptic('medium');
      
      // Show heart animation
      setDoubleTapHearts(prev => new Set(prev).add(videoId));
      setTimeout(() => {
        setDoubleTapHearts(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }, 1000);

      // Trigger like if not already liked
      if (!likedVideos.has(videoId)) {
        await handleLike(videoId);
      }
    } else {
      lastTapRef.current = { videoId, time: now };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;
    
    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance > 80) {
      setIsRefreshing(true);
      await fetchVideos();
      if (activeTab === "following") {
        await fetchFollowingVideos();
      }
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }, 500);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser && activeTab === "following") {
      fetchFollowingVideos();
    }
  }, [currentUser, activeTab]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user.id);
      fetchBookmarks(user.id);
      fetchFollows(user.id);
    }
  };

  const fetchFollows = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", userId);

      if (error) throw error;
      setFollowedUsers(new Set(data?.map(f => f.followed_id) || []));
    } catch (error) {
      console.error("Error fetching follows:", error);
    }
  };

  const fetchBookmarks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("video_id")
        .eq("user_id", userId);

      if (error) throw error;
      setBookmarkedVideos(new Set(data?.map(b => b.video_id) || []));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for all video creators
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const videosWithAvatars = data.map(video => ({
          ...video,
          avatar_url: profilesMap.get(video.user_id)
        }));
        
        setVideos(videosWithAvatars);
      } else {
        setVideos(data || []);
      }
      
      // Initialize all videos as muted by default
      if (data) {
        setMutedVideos(new Set(data.map(v => v.id)));
        fetchCommentCounts(data.map(v => v.id));
        fetchVideoChapters(data.map(v => v.id));
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingVideos = async () => {
    if (!currentUser) return;
    
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", currentUser);

      if (followsError) throw followsError;
      
      const followedIds = followsData?.map(f => f.followed_id) || [];
      
      if (followedIds.length === 0) {
        setFollowingVideos([]);
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .in("user_id", followedIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles for all video creators
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const videosWithAvatars = data.map(video => ({
          ...video,
          avatar_url: profilesMap.get(video.user_id)
        }));
        
        setFollowingVideos(videosWithAvatars);
      } else {
        setFollowingVideos(data || []);
      }
      
      // Initialize all videos as muted by default
      if (data) {
        setMutedVideos((prev) => new Set([...prev, ...data.map(v => v.id)]));
        fetchCommentCounts(data.map(v => v.id));
        fetchVideoChapters(data.map(v => v.id));
      }
    } catch (error) {
      console.error("Error fetching following videos:", error);
    }
  };

  const fetchCommentCounts = async (videoIds: string[]) => {
    try {
      const counts: Record<string, number> = {};
      
      for (const videoId of videoIds) {
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId);

        if (!error && count !== null) {
          counts[videoId] = count;
        }
      }
      
      setCommentCounts(counts);
    } catch (error) {
      console.error("Error fetching comment counts:", error);
    }
  };

  const fetchVideoChapters = async (videoIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from("video_chapters")
        .select("*")
        .in("video_id", videoIds)
        .order("timestamp", { ascending: true });

      if (error) throw error;

      const chaptersByVideo: Record<string, VideoChapter[]> = {};
      data?.forEach((chapter) => {
        if (!chaptersByVideo[chapter.video_id]) {
          chaptersByVideo[chapter.video_id] = [];
        }
        chaptersByVideo[chapter.video_id].push(chapter);
      });

      setVideoChapters(chaptersByVideo);
    } catch (error) {
      console.error("Error fetching video chapters:", error);
    }
  };

  const addChapter = async () => {
    if (!selectedChapterVideo || !currentUser || !newChapterLabel.trim()) return;

    try {
      const videoElement = videoRefs.current.get(selectedChapterVideo.id);
      if (!videoElement) return;

      const timestamp = videoElement.currentTime;

      const { data, error } = await supabase
        .from("video_chapters")
        .insert({
          video_id: selectedChapterVideo.id,
          user_id: currentUser,
          timestamp,
          label: newChapterLabel.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setVideoChapters((prev) => ({
        ...prev,
        [selectedChapterVideo.id]: [
          ...(prev[selectedChapterVideo.id] || []),
          data,
        ].sort((a, b) => a.timestamp - b.timestamp),
      }));

      setNewChapterLabel("");
      toast.success("Chapter added!");
    } catch (error) {
      console.error("Error adding chapter:", error);
      toast.error("Failed to add chapter");
    }
  };

  const updateChapterLabel = async (chapterId: string, newLabel: string) => {
    if (!newLabel.trim()) return;

    try {
      const { error } = await supabase
        .from("video_chapters")
        .update({ label: newLabel.trim() })
        .eq("id", chapterId);

      if (error) throw error;

      setVideoChapters((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((videoId) => {
          updated[videoId] = updated[videoId].map((chapter) =>
            chapter.id === chapterId
              ? { ...chapter, label: newLabel.trim() }
              : chapter
          );
        });
        return updated;
      });

      setEditingChapter(null);
      toast.success("Chapter updated!");
    } catch (error) {
      console.error("Error updating chapter:", error);
      toast.error("Failed to update chapter");
    }
  };

  const deleteChapter = async (chapterId: string, videoId: string) => {
    try {
      const { error } = await supabase
        .from("video_chapters")
        .delete()
        .eq("id", chapterId);

      if (error) throw error;

      setVideoChapters((prev) => ({
        ...prev,
        [videoId]: (prev[videoId] || []).filter((c) => c.id !== chapterId),
      }));

      toast.success("Chapter deleted!");
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Failed to delete chapter");
    }
  };

  const jumpToChapter = (videoId: string, timestamp: number) => {
    const videoElement = videoRefs.current.get(videoId);
    if (videoElement) {
      videoElement.currentTime = timestamp;
      videoElement.play();
      setPlayingVideos((prev) => new Set(prev).add(videoId));
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      const video = videos.find((v) => v.id === videoId) || followingVideos.find((v) => v.id === videoId);
      if (!video) return;

      const newLikeCount = video.likes + 1;
      
      // Achievement haptic for milestone likes (1st, 10th, 50th, 100th, etc.)
      if (newLikeCount === 1 || newLikeCount % 10 === 0 || newLikeCount % 50 === 0 || newLikeCount % 100 === 0) {
        await triggerHaptic('achievement');
      } else {
        await triggerHaptic('medium');
      }

      const { error } = await supabase
        .from("videos")
        .update({ likes: newLikeCount })
        .eq("id", videoId);

      if (error) throw error;

      setLikedVideos((prev) => new Set(prev).add(videoId));
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
      );
      setFollowingVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, likes: v.likes + 1 } : v))
      );
      toast.success("Liked!");
    } catch (error) {
      console.error("Error liking video:", error);
      toast.error("Failed to like video");
    }
  };

  const handleBookmark = async (videoId: string) => {
    if (!currentUser) {
      toast.error("Please login to bookmark videos");
      return;
    }

    try {
      await triggerHaptic('success');
      
      const isBookmarked = bookmarkedVideos.has(videoId);

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", currentUser)
          .eq("video_id", videoId);

        if (error) throw error;

        setBookmarkedVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
        toast.success("Bookmark removed");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: currentUser, video_id: videoId });

        if (error) throw error;

        setBookmarkedVideos((prev) => new Set(prev).add(videoId));
        toast.success("Video bookmarked!");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to bookmark video");
    }
  };

  const handleShare = async (videoId: string) => {
    await triggerHaptic('light');
    
    const video = videos.find((v) => v.id === videoId) || followingVideos.find((v) => v.id === videoId);
    if (video) {
      setSelectedShareVideo(video);
      setShareDialogOpen(true);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      await triggerHaptic('success');
      
      const isFollowing = followedUsers.has(userId);

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser)
          .eq("followed_id", userId);

        if (error) throw error;
        setFollowedUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        toast.success("Unfollowed");
      } else {
        const { error} = await supabase
          .from("follows")
          .insert({ follower_id: currentUser, followed_id: userId });

        if (error) throw error;
        setFollowedUsers(prev => new Set(prev).add(userId));
        toast.success("Following!");
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      toast.error("Failed to update follow status");
    }
  };

  const setVideoContainerRef = useCallback((videoId: string, element: HTMLDivElement | null) => {
    if (element) {
      videoContainerRefs.current.set(videoId, element);
    } else {
      videoContainerRefs.current.delete(videoId);
    }
  }, []);

  const handleMiniPlayerClick = () => {
    if (miniPlayerVideo) {
      const container = videoContainerRefs.current.get(miniPlayerVideo.video.id);
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setMiniPlayerVideo(null);
      }
    }
  };

  const handleCloseMiniPlayer = () => {
    if (miniPlayerVideo) {
      const video = videoRefs.current.get(miniPlayerVideo.video.id);
      if (video) {
        video.pause();
      }
    }
    setMiniPlayerVideo(null);
  };

  const handlePiPToggle = async (videoId: string) => {
    const video = videoRefs.current.get(videoId);
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
        setPipVideo(videoId);
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Picture-in-picture not supported');
    }
  };

  useEffect(() => {
    const handlePiPChange = () => {
      if (!document.pictureInPictureElement) {
        setPipVideo(null);
      }
    };

    document.addEventListener('leavepictureinpicture', handlePiPChange);
    return () => document.removeEventListener('leavepictureinpicture', handlePiPChange);
  }, []);

  const renderVideoCard = (video: VideoPost) => (
    <motion.div
      ref={(el) => setVideoContainerRef(video.id, el)}
      key={video.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-screen w-full snap-start snap-always"
    >
      <VideoSchema
        videoId={video.id}
        name={video.caption || `Video by ${video.username}`}
        description={video.caption || `Watch this video by ${video.username} on Voice2Fire`}
        thumbnailUrl={video.video_url}
        uploadDate={new Date().toISOString()}
        contentUrl={video.video_url}
        embedUrl={`https://voice2fire.com/video/${video.id}`}
        interactionStatistic={{
          viewCount: video.views,
          likeCount: video.likes,
          commentCount: commentCounts[video.id] || 0,
        }}
        author={{
          name: video.username,
          url: `https://voice2fire.com/profile/${video.user_id}`,
        }}
      />

      {/* Full-screen video container - Mobile: full screen, Desktop: centered with 9:16 */}
      <div className="relative h-full w-full bg-black md:flex md:items-center md:justify-center">
        {/* Desktop: centered container, Mobile: full width */}
        <div className="relative h-full w-full md:h-auto md:max-h-screen md:w-auto md:aspect-[9/16]">
          <div
            className="relative h-full w-full flex items-center justify-center"
            onClick={() => handleDoubleTap(video.id)}
            onTouchEnd={() => handleDoubleTap(video.id)}
          >
            <video
              ref={(el) => setVideoRef(video.id, el)}
              data-video-id={video.id}
              src={video.video_url}
              className="h-full w-full object-contain"
              style={{ aspectRatio: '9/16' }}
              preload="metadata"
              playsInline
              muted={mutedVideos.has(video.id)}
              loop
            />
          
          {/* Play/Pause and Mute controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                const videoElement = videoRefs.current.get(video.id);
                if (!videoElement) return;
                
                if (videoElement.paused) {
                  videoElement.play();
                  setPlayingVideos((prev) => new Set(prev).add(video.id));
                } else {
                  videoElement.pause();
                  setPlayingVideos((prev) => {
                    const next = new Set(prev);
                    next.delete(video.id);
                    return next;
                  });
                }
              }}
              className="bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90"
            >
              {playingVideos.has(video.id) ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const videoElement = videoRefs.current.get(video.id);
                if (!videoElement) return;
                
                if (mutedVideos.has(video.id)) {
                  videoElement.muted = false;
                  setMutedVideos((prev) => {
                    const next = new Set(prev);
                    next.delete(video.id);
                    return next;
                  });
                } else {
                  videoElement.muted = true;
                  setMutedVideos((prev) => new Set(prev).add(video.id));
                }
              }}
              className="bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90"
            >
              {mutedVideos.has(video.id) ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            
            {/* Quality indicator badge (ABR) */}
            {autoQualityEnabled && activeQuality[video.id] && (
              <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${
                  bufferHealth[video.id] >= 10 ? 'bg-green-500' :
                  bufferHealth[video.id] >= 5 ? 'bg-yellow-500' :
                  bufferHealth[video.id] >= 2 ? 'bg-orange-500' : 'bg-red-500'
                } animate-pulse`} />
                <span className="text-xs font-semibold">{activeQuality[video.id]}</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const videoElement = videoRefs.current.get(video.id);
                if (!videoElement) return;
                
                const videoContainer = videoElement.parentElement;
                if (!videoContainer) return;
                
                if (fullscreenVideoId === video.id) {
                  // Exit fullscreen
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  } else if ((document as any).webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                  } else if ((document as any).mozCancelFullScreen) {
                    (document as any).mozCancelFullScreen();
                  } else if ((document as any).msExitFullscreen) {
                    (document as any).msExitFullscreen();
                  }
                  setFullscreenVideoId(null);
                } else {
                  // Enter fullscreen
                  if (videoContainer.requestFullscreen) {
                    videoContainer.requestFullscreen();
                  } else if ((videoContainer as any).webkitRequestFullscreen) {
                    (videoContainer as any).webkitRequestFullscreen();
                  } else if ((videoContainer as any).mozRequestFullScreen) {
                    (videoContainer as any).mozRequestFullScreen();
                  } else if ((videoContainer as any).msRequestFullscreen) {
                    (videoContainer as any).msRequestFullscreen();
                  }
                  setFullscreenVideoId(video.id);
                }
              }}
              className="bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90"
            >
              {fullscreenVideoId === video.id ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCaptionsEnabled(prev => {
                  const next = new Set(prev);
                  if (next.has(video.id)) {
                    next.delete(video.id);
                  } else {
                    next.add(video.id);
                  }
                  return next;
                });
              }}
              className={cn(
                "bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90",
                captionsEnabled.has(video.id) && "text-primary"
              )}
            >
              <Subtitles className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePiPToggle(video.id);
              }}
              className={cn(
                "bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90",
                pipVideo === video.id && "text-primary"
              )}
            >
              <PictureInPicture className="h-5 w-5" />
            </Button>
            
            {currentUser === video.user_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChapterVideo(video);
                  setChaptersDialogOpen(true);
                }}
                className={cn(
                  "bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90",
                  videoChapters[video.id]?.length > 0 && "text-primary"
                )}
              >
                <ListVideo className="h-5 w-5" />
              </Button>
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background/80 backdrop-blur-sm rounded-full h-10 w-10 p-0 hover:bg-background/90"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-quality">Video Quality</Label>
                    <Select value={videoQuality} onValueChange={(value: typeof videoQuality) => setVideoQuality(value)}>
                      <SelectTrigger id="video-quality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          Auto - Adaptive (ABR)
                        </SelectItem>
                        <SelectItem value="360p">360p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      </SelectContent>
                    </Select>
                    {autoQualityEnabled ? (
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          Network: {networkSpeed === 'fast' ? '🟢 Fast' : networkSpeed === 'medium' ? '🟡 Medium' : '🔴 Slow'}
                        </p>
                        <p className="text-primary font-medium">
                          ✨ Adaptive streaming automatically adjusts quality based on buffer health
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Quality locked to {videoQuality}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="caption-size">Caption Size</Label>
                    <Select value={captionTextSize} onValueChange={(value: 'small' | 'medium' | 'large') => setCaptionTextSize(value)}>
                      <SelectTrigger id="caption-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="caption-bg">Caption Background</Label>
                    <Select value={captionBackground} onValueChange={(value: 'none' | 'semi' | 'solid') => setCaptionBackground(value)}>
                      <SelectTrigger id="caption-bg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="semi">Semi-transparent</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Quality Badge */}
          {videoQuality === 'auto' && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                networkSpeed === 'fast' ? "bg-green-500" : networkSpeed === 'medium' ? "bg-yellow-500" : "bg-red-500"
              )} />
              {currentQuality}
            </div>
          )}
          
          {/* Caption overlay */}
          {captionsEnabled.has(video.id) && video.caption && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none">
              <div
                className={cn(
                  "px-4 py-2 rounded-lg max-w-[90%] text-center text-white font-medium",
                  captionTextSize === 'small' && "text-sm",
                  captionTextSize === 'medium' && "text-base",
                  captionTextSize === 'large' && "text-lg",
                  captionBackground === 'none' && "text-shadow-lg",
                  captionBackground === 'semi' && "bg-black/60 backdrop-blur-sm",
                  captionBackground === 'solid' && "bg-black"
                )}
                style={captionBackground === 'none' ? {
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.8)'
                } : undefined}
              >
                {video.caption}
              </div>
            </div>
          )}

          {/* Video progress bar */}
          {videoProgress[video.id] && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 bg-background/30 backdrop-blur-sm cursor-pointer hover:h-2 transition-all duration-200"
              onMouseEnter={() => {
                if (!canvasRef.current) {
                  canvasRef.current = document.createElement('canvas');
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                const timestamp = (percentage / 100) * videoProgress[video.id].duration;
                
                // Capture thumbnail at hovered timestamp
                const videoElement = videoRefs.current.get(video.id);
                if (videoElement && canvasRef.current) {
                  const canvas = canvasRef.current;
                  canvas.width = 160;
                  canvas.height = 90;
                  const ctx = canvas.getContext('2d');
                  
                  // Store current time to restore later
                  const currentTime = videoElement.currentTime;
                  videoElement.currentTime = timestamp;
                  
                  // Wait for seek to complete
                  videoElement.onseeked = () => {
                    if (ctx) {
                      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                      const thumbnail = canvas.toDataURL();
                      setHoveredProgress({
                        videoId: video.id,
                        percentage,
                        x: e.clientX,
                        thumbnail
                      });
                      // Restore original time
                      videoElement.currentTime = currentTime;
                    }
                  };
                }
              }}
              onMouseLeave={() => {
                setHoveredProgress(null);
              }}
            >
              {/* Buffered progress */}
              <div
                className="absolute top-0 left-0 h-full bg-muted/50 transition-all duration-300"
                style={{
                  width: `${(videoProgress[video.id].buffered / videoProgress[video.id].duration) * 100}%`
                }}
              />
              {/* Playback progress */}
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
                style={{
                  width: `${(videoProgress[video.id].current / videoProgress[video.id].duration) * 100}%`
                }}
              />
              
              {/* Hover indicator */}
              {hoveredProgress && hoveredProgress.videoId === video.id && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/80"
                  style={{
                    left: `${hoveredProgress.percentage}%`
                  }}
                />
              )}
              
              {/* Chapter markers */}
              {videoChapters[video.id]?.map((chapter) => (
                <div
                  key={chapter.id}
                  className="absolute top-0 h-full w-1 bg-accent hover:bg-accent/80 cursor-pointer transition-colors"
                  style={{
                    left: `${(chapter.timestamp / videoProgress[video.id].duration) * 100}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToChapter(video.id, chapter.timestamp);
                  }}
                  title={chapter.label}
                />
              ))}
            </div>
          )}
          
          {/* Thumbnail preview tooltip */}
          {hoveredProgress && hoveredProgress.videoId === video.id && (
            <div
              className="fixed z-50 -translate-x-1/2 pointer-events-none"
              style={{
                left: `${hoveredProgress.x}px`,
                bottom: '80px'
              }}
            >
              <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                <img 
                  src={hoveredProgress.thumbnail} 
                  alt="Video preview"
                  className="w-40 h-auto"
                />
                <div className="px-2 py-1 text-xs text-center text-muted-foreground">
                  {new Date((hoveredProgress.percentage / 100) * videoProgress[video.id].duration * 1000).toISOString().substr(14, 5)}
                </div>
              </div>
            </div>
          )}
          
          {/* Double-tap heart animation */}
          {doubleTapHearts.has(video.id) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-24 h-24 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </div>
        
        {/* Action buttons - Mobile: bottom-right, Desktop: centered right side */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-10 md:right-8 md:top-1/2 md:-translate-y-1/2 md:bottom-auto">
          {/* Follow button with heart */}
          {currentUser && video.user_id !== currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFollow(video.user_id)}
              className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0 relative"
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {video.avatar_url ? (
                    <img 
                      src={video.avatar_url} 
                      alt={video.username}
                      className="h-12 w-12 rounded-full object-cover border-2 border-background"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                      <span className="text-sm font-semibold text-foreground">{video.username[0].toUpperCase()}</span>
                    </div>
                  )}
                  {!followedUsers.has(video.user_id) && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full h-6 w-6 flex items-center justify-center">
                      <UserPlus className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </Button>
          )}
          
          {/* Like button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0"
          >
            <div className="flex flex-col items-center gap-1">
              <Heart
                className={`h-7 w-7 ${likedVideos.has(video.id) ? "fill-red-500 text-red-500" : "text-white"}`}
              />
              <span className="text-xs text-white font-semibold">{video.likes}</span>
            </div>
          </Button>

          {/* Comments button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedVideoId(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0"
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="h-7 w-7 text-white" />
              <span className="text-xs text-white font-semibold">{commentCounts[video.id] || 0}</span>
            </div>
          </Button>

          {/* Bookmark button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBookmark(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0"
          >
            <div className="flex flex-col items-center gap-1">
              <Bookmark
                className={`h-7 w-7 ${bookmarkedVideos.has(video.id) ? "fill-yellow-400 text-yellow-400" : "text-white"}`}
              />
            </div>
          </Button>

          {/* Share button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShare(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0"
          >
            <div className="flex flex-col items-center gap-1">
              <Share2 className="h-7 w-7 text-white" />
            </div>
          </Button>

          {/* Promote button (only for video owner) */}
          {currentUser && video.user_id === currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPromoteVideo(video);
                setPromoteDialogOpen(true);
              }}
              className="bg-background/80 backdrop-blur-sm rounded-full h-14 w-14 p-0"
            >
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
            </Button>
          )}
        </div>
        </div>

        {/* User info and caption - bottom left */}
        <div className="absolute left-4 bottom-24 right-24 z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg drop-shadow-lg">@{video.username}</span>
          </div>
          {video.caption && (
            <p className="text-sm drop-shadow-lg line-clamp-2">{video.caption}</p>
          )}
        </div>

        {/* Mini progress bar at the bottom */}
        {videoProgress[video.id] && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
            {/* Buffered progress (light gray) */}
            <div
              className="absolute top-0 left-0 h-full bg-white/40 transition-all duration-300"
              style={{
                width: `${(videoProgress[video.id].buffered / videoProgress[video.id].duration) * 100}%`
              }}
            />
            {/* Playback progress (white/primary) */}
            <div
              className="absolute top-0 left-0 h-full bg-white transition-all duration-100"
              style={{
                width: `${(videoProgress[video.id].current / videoProgress[video.id].duration) * 100}%`
              }}
            />
          </div>
        )}
      </div>
      
      {/* Chapters list */}
      {videoChapters[video.id]?.length > 0 && (
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChaptersList(prev => {
                const next = new Set(prev);
                if (next.has(video.id)) {
                  next.delete(video.id);
                } else {
                  next.add(video.id);
                }
                return next;
              });
            }}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <ListVideo className="h-4 w-4" />
              {videoChapters[video.id].length} Chapter{videoChapters[video.id].length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {showChaptersList.has(video.id) ? 'Hide' : 'Show'}
            </span>
          </Button>
          
          {showChaptersList.has(video.id) && (
            <ScrollArea className="h-32 mt-2">
              <div className="space-y-2">
                {videoChapters[video.id].map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => jumpToChapter(video.id, chapter.timestamp)}
                    className="w-full text-left px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors flex items-start justify-between group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{chapter.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(chapter.timestamp * 1000).toISOString().substr(14, 5)}
                      </div>
                    </div>
                    <Play className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div 
      ref={containerRef}
      className="relative h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://voice2fire.com/" },
          { name: "Feed", url: "https://voice2fire.com/feed" }
        ]}
      />
      
      {/* Dynamic Open Graph tags for current video */}
      {currentVisibleVideoId && (() => {
        const currentVideo = [...videos, ...followingVideos].find(v => v.id === currentVisibleVideoId);
        return currentVideo ? (
          <OpenGraphTags
            videoId={currentVideo.id}
            title={currentVideo.caption || `Video by ${currentVideo.username}`}
            description={currentVideo.caption || `Watch this video by ${currentVideo.username} on Voice2Fire`}
            thumbnailUrl={currentVideo.video_url}
            videoUrl={currentVideo.video_url}
            author={{
              name: currentVideo.username,
              url: `https://voice2fire.com/profile/${currentVideo.user_id}`
            }}
            views={currentVideo.views}
            likes={currentVideo.likes}
          />
        ) : null;
      })()}
      
      {/* Pull to refresh indicator */}
      <div 
        className="fixed top-0 left-0 right-0 flex justify-center z-50 transition-all duration-200"
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance - 40, 60) : -100}px)`,
          opacity: isPulling ? Math.min(pullDistance / 80, 1) : 0
        }}
      >
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              <span className="text-sm font-medium">Refreshing...</span>
            </>
          ) : (
            <span className="text-sm font-medium">
              {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          )}
        </div>
      </div>

      {/* Tab switcher and content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab switcher - floating at top */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <TabsList className="bg-background/80 backdrop-blur-sm">
            <TabsTrigger value="forYou">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </div>

        {/* Video feed */}
        <TabsContent value="forYou" className="mt-0">
          {loading ? (
            <div className="h-screen flex items-center justify-center text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p>Loading amazing content...</p>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="h-screen flex items-center justify-center text-white text-center px-4">
              No videos yet
            </div>
          ) : (
            videos.map(renderVideoCard)
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          {!currentUser ? (
            <div className="h-screen flex items-center justify-center text-white text-center px-4">
              Please login to see videos from people you follow
            </div>
          ) : followingVideos.length === 0 ? (
            <div className="h-screen flex items-center justify-center text-white text-center px-4">
              No videos from followed users yet. Start following creators!
            </div>
          ) : (
            followingVideos.map(renderVideoCard)
          )}
        </TabsContent>
      </Tabs>

      <CommentsDrawer
        videoId={selectedVideoId || ""}
        isOpen={!!selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
        commentCount={selectedVideoId ? commentCounts[selectedVideoId] || 0 : 0}
        onCommentAdded={() => {
          if (selectedVideoId) {
            fetchCommentCounts([selectedVideoId]);
          }
        }}
      />

      {selectedPromoteVideo && (
        <PromotePostDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          videoId={selectedPromoteVideo.id}
          videoUrl={selectedPromoteVideo.video_url}
          caption={selectedPromoteVideo.caption || ""}
        />
      )}
      
      {selectedShareVideo && (
        <SocialShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          videoId={selectedShareVideo.id}
          videoCaption={selectedShareVideo.caption || undefined}
          username={selectedShareVideo.username}
        />
      )}
      
      {/* Chapters Management Dialog */}
      <Dialog open={chaptersDialogOpen} onOpenChange={setChaptersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Chapters</DialogTitle>
            <DialogDescription>
              Add chapters to help viewers navigate your video
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add new chapter */}
            <div className="space-y-2">
              <Label htmlFor="chapter-label">Add Chapter at Current Time</Label>
              <div className="flex gap-2">
                <Input
                  id="chapter-label"
                  placeholder="Chapter label"
                  value={newChapterLabel}
                  onChange={(e) => setNewChapterLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newChapterLabel.trim()) {
                      addChapter();
                    }
                  }}
                />
                <Button onClick={addChapter} disabled={!newChapterLabel.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedChapterVideo && (
                <p className="text-xs text-muted-foreground">
                  Current time: {new Date((videoRefs.current.get(selectedChapterVideo.id)?.currentTime || 0) * 1000).toISOString().substr(14, 5)}
                </p>
              )}
            </div>
            
            {/* Existing chapters */}
            {selectedChapterVideo && videoChapters[selectedChapterVideo.id]?.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Chapters</Label>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {videoChapters[selectedChapterVideo.id].map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex-1">
                          {editingChapter?.id === chapter.id ? (
                            <Input
                              value={editingChapter.label}
                              onChange={(e) =>
                                setEditingChapter({ ...editingChapter, label: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateChapterLabel(chapter.id, editingChapter.label);
                                } else if (e.key === 'Escape') {
                                  setEditingChapter(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="text-sm font-medium">{chapter.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(chapter.timestamp * 1000).toISOString().substr(14, 5)}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {editingChapter?.id === chapter.id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateChapterLabel(chapter.id, editingChapter.label)}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingChapter(chapter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteChapter(chapter.id, selectedChapterVideo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChaptersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background border border-border rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Playback Controls</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Play / Pause</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Seek backward 5 seconds</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">←</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Seek forward 5 seconds</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">→</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Audio & Display</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Mute / Unmute</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">M</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Toggle fullscreen</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">F</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Previous video</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">↑</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Next video</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">↓</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">General</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Show keyboard shortcuts</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">?</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Close this dialog</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mini Player */}
      {miniPlayerVideo && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          className="fixed bottom-20 right-4 z-50 w-64 bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseMiniPlayer}
            className="absolute top-2 right-2 z-10 h-6 w-6 bg-background/50 hover:bg-background/80 backdrop-blur-sm"
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Video */}
          <div 
            className="relative aspect-[9/16] cursor-pointer"
            onClick={handleMiniPlayerClick}
          >
            <video
              ref={(el) => el && setVideoRef(miniPlayerVideo.video.id, el)}
              data-video-id={miniPlayerVideo.video.id}
              src={miniPlayerVideo.video.video_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              autoPlay={miniPlayerVideo.wasPlaying}
              muted={mutedVideos.has(miniPlayerVideo.video.id)}
            />
            
            {/* Play/Pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              {!playingVideos.has(miniPlayerVideo.video.id) && (
                <Play className="h-8 w-8 text-white" />
              )}
            </div>

            {/* Video info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">
                @{miniPlayerVideo.video.username}
              </p>
              {miniPlayerVideo.video.caption && (
                <p className="text-white/80 text-xs truncate">
                  {miniPlayerVideo.video.caption}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
