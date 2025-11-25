import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus, UserMinus, TrendingUp, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles, Settings, X, PictureInPicture, ListVideo, Plus, Edit, Trash2, AlertCircle, Loader2, MoreHorizontal, Layers, LayoutPanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useHapticSettings } from "@/hooks/useHapticSettings";
import { AddToCollectionDialog } from "@/components/AddToCollectionDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FeedSettingsDialog } from "@/components/FeedSettingsDialog";
import { SendGiftDialog } from "@/components/SendGiftDialog";
import { Gift } from "lucide-react";

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
  const { settings: hapticSettings } = useHapticSettings();
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
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedGiftVideo, setSelectedGiftVideo] = useState<VideoPost | null>(null);
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
  const [justFollowed, setJustFollowed] = useState<string | null>(null);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<'side-panel' | 'overlay'>(() => {
    const saved = localStorage.getItem('feed-desktop-layout');
    return (saved === 'side-panel' || saved === 'overlay') ? saved : 'side-panel';
  });
  const [autoPlay, setAutoPlay] = useState<boolean>(() => {
    const saved = localStorage.getItem('feed-auto-play');
    return saved !== null ? saved === 'true' : true;
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoMilestones = useRef<Map<string, Set<number>>>(new Map()); // Track triggered milestones per video
  const [currentVisibleVideoId, setCurrentVisibleVideoId] = useState<string | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [fullscreenVideoId, setFullscreenVideoId] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState<Set<string>>(new Set());
  const [captionTextSize, setCaptionTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [captionBackground, setCaptionBackground] = useState<'none' | 'semi' | 'solid'>('semi');
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [bufferingVideos, setBufferingVideos] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressProgress = useRef<NodeJS.Timeout[]>([]);
  const [longPressActive, setLongPressActive] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ videoId: string; x: number; y: number } | null>(null);
  const [addToCollectionDialogOpen, setAddToCollectionDialogOpen] = useState(false);
  const [selectedCollectionVideo, setSelectedCollectionVideo] = useState<string | null>(null);
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

  // Enhanced haptic feedback helper with custom patterns and settings
  const triggerHaptic = async (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'notification' | 'achievement' | 'warning' | 'error' = 'light', type?: 'interactions' | 'milestones' | 'achievements' | 'errors' | 'navigation' | 'longPress') => {
    // Check if haptics are globally enabled
    if (!hapticSettings.enabled) return;
    
    // Check if this specific type is enabled
    if (type && !hapticSettings.enabledTypes[type]) return;
    
    try {
      // Adjust intensity based on user settings
      const getAdjustedStyle = (base: ImpactStyle) => {
        if (hapticSettings.intensity === 'light') {
          return ImpactStyle.Light;
        } else if (hapticSettings.intensity === 'strong') {
          return base === ImpactStyle.Light ? ImpactStyle.Medium : ImpactStyle.Heavy;
        }
        return base;
      };
      
      switch (pattern) {
        case 'light':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Light) });
          break;
        case 'medium':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) });
          break;
        case 'heavy':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'achievement':
          await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Heavy) });
          setTimeout(async () => {
            await Haptics.notification({ type: NotificationType.Success });
          }, 100);
          break;
        case 'notification':
          const duration = hapticSettings.intensity === 'light' ? 30 : hapticSettings.intensity === 'strong' ? 70 : 50;
          await Haptics.vibrate({ duration });
          setTimeout(async () => {
            await Haptics.vibrate({ duration: duration * 0.6 });
          }, 100);
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          setTimeout(async () => {
            await Haptics.impact({ style: getAdjustedStyle(ImpactStyle.Medium) });
          }, 150);
          break;
      }
    } catch (error) {
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

    // ABR monitoring loop - DISABLED to prevent flashing/crashing
    const checkBufferHealth = () => {
      // ABR temporarily disabled - quality switching was causing video flashing and crashes
      return;
      
      if (!autoQualityEnabled || videoQuality !== 'auto') return;

      const currentVideos = activeTab === "following" ? followingVideos : videos;
      
      currentVideos.forEach(video => {
        const videoElement = videoRefs.current.get(video.id);
        if (!videoElement || !(videoElement instanceof HTMLVideoElement) || videoElement.paused) return;

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

    // ABR monitoring disabled to prevent video flashing
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
        const video = entry.target as HTMLVideoElement | HTMLIFrameElement;
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
          
          // Only auto-play if enabled
          if (autoPlay) {
            // Handle both video elements and iframes differently
            if (video.tagName === 'VIDEO') {
              const videoElement = video as HTMLVideoElement;
              
              // Only try to play if video is ready
              if (videoElement.readyState >= 2) {
                videoElement.play().then(() => {
                  if (videoId) {
                    setPlayingVideos((prev) => new Set(prev).add(videoId));
                  }
                }).catch((err) => {
                  console.error(`[Feed] Failed to play video ${videoId}:`, err);
                });
              }
            } else if (video.tagName === 'IFRAME') {
              // For iframes (YouTube), use postMessage API for reliable control
              if (videoId) {
                setPlayingVideos((prev) => new Set(prev).add(videoId));
                
                // Use YouTube iframe API to play video
                try {
                  const iframe = video as HTMLIFrameElement;
                  iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                } catch (err) {
                  console.error(`[Feed] Failed to play YouTube iframe ${videoId}:`, err);
                }
              }
            }
          }
        } else {
          // Pause all videos when they leave viewport
          if (videoId) {
            // Check if video was playing before pausing using state
            const wasPlaying = playingVideos.has(videoId);

            // Remove from playing set first
            setPlayingVideos((prev) => {
              const newSet = new Set(prev);
              newSet.delete(videoId);
              return newSet;
            });
            
            // For native video elements, pause them
            if (video.tagName === 'VIDEO') {
              (video as HTMLVideoElement).pause();
            } else if (video.tagName === 'IFRAME') {
              // Use YouTube iframe API to pause video
              try {
                const iframe = video as HTMLIFrameElement;
                iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
              } catch (err) {
                console.error(`[Feed] Failed to pause YouTube iframe ${videoId}:`, err);
              }
            }
            
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
  }, [videos, followingVideos, activeTab, miniPlayerVideo, autoPlay]);

  // Smart video preloading - only load current video to prevent crashes
  useEffect(() => {
    const currentVideos = activeTab === "following" ? followingVideos : videos;
    if (currentVideos.length === 0 || !currentVisibleVideoId) return;
    
    const currentIndex = currentVideos.findIndex(v => v.id === currentVisibleVideoId);
    if (currentIndex === -1) return;
    
    // Only preload current video and next video (minimal approach to prevent memory issues)
    const preloadCount = 1;
    
    // Preload current + next video only
    for (let i = currentIndex; i <= currentIndex + preloadCount && i < currentVideos.length; i++) {
      const videoId = currentVideos[i].id;
      const videoElement = videoRefs.current.get(videoId);
      
      if (videoElement && videoElement instanceof HTMLVideoElement) {
        // Only 'auto' for current video, 'metadata' for next
        if (i === currentIndex) {
          videoElement.preload = 'auto';
          // Trigger load for current video
          if (videoElement.readyState < 2) {
            videoElement.load();
          }
        } else {
          videoElement.preload = 'metadata';
        }
      }
    }
    
    // Set all other videos to preload='none' to prevent excessive memory usage
    for (let i = 0; i < currentVideos.length; i++) {
      if (i < currentIndex || i > currentIndex + preloadCount) {
        const videoId = currentVideos[i]?.id;
        const videoElement = videoRefs.current.get(videoId);
        if (videoElement && videoElement instanceof HTMLVideoElement) {
          videoElement.preload = 'none';
          // Pause and unload videos that are far from view
          if (Math.abs(i - currentIndex) > 2) {
            videoElement.pause();
            videoElement.src = '';
            videoElement.load();
          }
        }
      }
    }
  }, [currentVisibleVideoId, videos, followingVideos, activeTab]);

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
          triggerHaptic('light', 'interactions');
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
        
        case 'KeyP':
          e.preventDefault();
          handlePiPToggle(currentVisibleVideoId);
          if (pipVideo === currentVisibleVideoId) {
            toast.success('Exited Picture-in-Picture', { duration: 1000 });
          } else {
            toast.success('Picture-in-Picture mode', { duration: 1000 });
          }
          break;
        
        // Number keys for quick progress jumps
        case 'Digit0':
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          e.preventDefault();
          const digit = parseInt(e.code.replace('Digit', ''));
          const percentage = digit * 10;
          const targetTime = (videoElement.duration * percentage) / 100;
          videoElement.currentTime = targetTime;
          toast.success(`Jumped to ${percentage}%`, { duration: 1000 });
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
          triggerHaptic('light', 'navigation');
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
          triggerHaptic('light', 'navigation');
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

  const setVideoRef = useCallback((videoId: string, element: HTMLVideoElement | HTMLIFrameElement | null) => {
    if (element) {
      // Always store the element so observers and layout logic can use it
      videoRefs.current.set(videoId, element as any);

      // Only attach time/progress/error handlers to real HTMLVideoElements
      if (!(element instanceof HTMLVideoElement)) {
        return;
      }

      const videoElement = element as HTMLVideoElement;
      
      // Add event listeners for progress tracking
      const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        setVideoProgress(prev => ({
          ...prev,
          [videoId]: {
            current: currentTime,
            duration: duration,
            buffered: videoElement.buffered.length > 0 ? videoElement.buffered.end(videoElement.buffered.length - 1) : 0
          }
        }));

        // Track and trigger haptics for playback milestones
        if (duration > 0) {
          const percentage = (currentTime / duration) * 100;
          const milestones = [25, 50, 75, 100];
          
          // Get or initialize milestone tracking for this video
          if (!videoMilestones.current.has(videoId)) {
            videoMilestones.current.set(videoId, new Set());
          }
          const triggeredMilestones = videoMilestones.current.get(videoId)!;
          
          // Check each milestone
          for (const milestone of milestones) {
            if (percentage >= milestone && !triggeredMilestones.has(milestone)) {
              triggeredMilestones.add(milestone);
              triggerHaptic('notification'); // Subtle pulse for progress feedback
              break; // Only trigger one milestone at a time
            }
          }
        }
      };
      
      const handleProgress = () => {
        if (videoElement.buffered.length > 0) {
          setVideoProgress(prev => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              buffered: videoElement.buffered.end(videoElement.buffered.length - 1)
            }
          }));
        }
      };
      
      const handleLoadedMetadata = () => {
        // Reset milestone tracking when video metadata loads
        videoMilestones.current.set(videoId, new Set());
        
        setVideoProgress(prev => ({
          ...prev,
          [videoId]: {
            current: 0,
            duration: videoElement.duration,
            buffered: 0
          }
        }));
      };
      
      // Error handling with haptic feedback (debounced per video)
      const handleError = () => {
        setVideoErrors(prev => {
          // If we've already recorded an error for this video, don't spam toasts
          if (prev.has(videoId)) {
            return prev;
          }

          const next = new Set(prev);
          next.add(videoId);

          triggerHaptic('error');
          toast.error('Video playback failed', {
            description: 'Unable to play this video. Please try again.'
          });

          // Clear error after 5 seconds so UI indicator goes away
          setTimeout(() => {
            setVideoErrors(current => {
              const updated = new Set(current);
              updated.delete(videoId);
              return updated;
            });
          }, 5000);

          return next;
        });
      };
      
      const handleStalled = () => {
        triggerHaptic('warning');
        setBufferingVideos(prev => new Set(prev).add(videoId));
      };
      
      const handleWaiting = () => {
        setBufferingVideos(prev => new Set(prev).add(videoId));
        
        // Trigger warning haptic for buffering (with debouncing to avoid too many triggers)
        const lastWarning = (videoElement as any)._lastBufferingWarning || 0;
        const now = Date.now();
        if (now - lastWarning > 2000) { // Only trigger once every 2 seconds
          triggerHaptic('warning');
          (videoElement as any)._lastBufferingWarning = now;
        }
      };
      
      const handlePlaying = () => {
        // Clear buffering state when video starts playing
        setBufferingVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      };
      
      const handleCanPlay = () => {
        // Clear buffering state when video is ready to play
        setBufferingVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      };
      
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('progress', handleProgress);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('stalled', handleStalled);
      videoElement.addEventListener('waiting', handleWaiting);
      videoElement.addEventListener('playing', handlePlaying);
      videoElement.addEventListener('canplay', handleCanPlay);
      
      // Store cleanup function
      (videoElement as any)._cleanup = () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('progress', handleProgress);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('stalled', handleStalled);
        videoElement.removeEventListener('waiting', handleWaiting);
        videoElement.removeEventListener('playing', handlePlaying);
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    } else {
      const video = videoRefs.current.get(videoId) as any;
      if (video && video._cleanup) {
        video._cleanup();
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
      await triggerHaptic('medium', 'interactions');
      
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
      triggerHaptic('light', 'navigation');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;
    
    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
      
      // Trigger medium haptic when reaching refresh threshold
      if (distance > 80 && distance < 85) {
        triggerHaptic('medium', 'navigation');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance > 80) {
      triggerHaptic('success'); // Success haptic when refresh triggers
      setIsRefreshing(true);
      await fetchVideos();
      if (activeTab === "following") {
        await fetchFollowingVideos();
      }
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
        triggerHaptic('notification'); // Subtle confirmation when refresh completes
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
      // Check which videos are in any of the user's collections
      const { data, error } = await supabase
        .from("collection_items")
        .select("video_id")
        .eq("user_id", userId);

      if (error) throw error;
      setBookmarkedVideos(new Set(data?.map(b => b.video_id) || []));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    }
  };

  const isYouTubeUrl = (url: string) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter out YouTube-imported videos temporarily to avoid playback issues
      const nonYouTubeVideos = (data || []).filter(v => !isYouTubeUrl(v.video_url));
      
      // Fetch profiles for all video creators
      if (nonYouTubeVideos.length > 0) {
        const userIds = [...new Set(nonYouTubeVideos.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", userIds);
        
        // Fetch follower counts for all users
        const followerCountsMap: Record<string, number> = {};
        for (const userId of userIds) {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: 'exact', head: true })
            .eq("followed_id", userId);
          followerCountsMap[userId] = count || 0;
        }
        setFollowerCounts(followerCountsMap);
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const videosWithAvatars = nonYouTubeVideos.map(video => ({
          ...video,
          avatar_url: profilesMap.get(video.user_id)
        }));
        
        setVideos(videosWithAvatars);
      } else {
        setVideos(nonYouTubeVideos);
      }
      
      // Initialize all videos as muted by default
      if (nonYouTubeVideos.length > 0) {
        setMutedVideos(new Set(nonYouTubeVideos.map(v => v.id)));
        fetchCommentCounts(nonYouTubeVideos.map(v => v.id));
        fetchVideoChapters(nonYouTubeVideos.map(v => v.id));
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
      
      // Filter out YouTube-imported videos temporarily
      const nonYouTubeVideos = (data || []).filter(v => !isYouTubeUrl(v.video_url));
      
      // Fetch profiles for all video creators
      if (nonYouTubeVideos.length > 0) {
        const userIds = [...new Set(nonYouTubeVideos.map(v => v.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", userIds);
        
        // Fetch follower counts for all users
        const followerCountsMap: Record<string, number> = {};
        for (const userId of userIds) {
          const { count } = await supabase
            .from("follows")
            .select("*", { count: 'exact', head: true })
            .eq("followed_id", userId);
          followerCountsMap[userId] = count || 0;
        }
        setFollowerCounts(prev => ({ ...prev, ...followerCountsMap }));
        
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.avatar_url]) || []);
        
        const videosWithAvatars = nonYouTubeVideos.map(video => ({
          ...video,
          avatar_url: profilesMap.get(video.user_id)
        }));
        
        setFollowingVideos(videosWithAvatars);
      } else {
        setFollowingVideos(nonYouTubeVideos);
      }
      
      // Initialize all videos as muted by default
      if (nonYouTubeVideos.length > 0) {
        setMutedVideos((prev) => new Set([...prev, ...nonYouTubeVideos.map(v => v.id)]));
        fetchCommentCounts(nonYouTubeVideos.map(v => v.id));
        fetchVideoChapters(nonYouTubeVideos.map(v => v.id));
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
        await triggerHaptic('achievement', 'achievements');
      } else {
        await triggerHaptic('medium', 'interactions');
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

    // Open collection dialog instead of quick bookmark
    setSelectedCollectionVideo(videoId);
    setAddToCollectionDialogOpen(true);
  };

  // Long-press handlers with progressive haptic feedback
  const handleLongPressStart = (videoId: string, action: () => void, x?: number, y?: number) => {
    // Check if long-press haptics are enabled
    if (!hapticSettings.enabled || !hapticSettings.enabledTypes.longPress) {
      return;
    }
    
    // Clear any existing timers
    clearLongPress();
    
    setLongPressActive(videoId);
    
    const duration = hapticSettings.longPressDuration;
    
    // Progressive haptic feedback at intervals scaled to duration
    const hapticProgression = [
      { delay: 0, intensity: 'light' as const },
      { delay: duration * 0.2, intensity: 'light' as const },
      { delay: duration * 0.4, intensity: 'medium' as const },
      { delay: duration * 0.6, intensity: 'medium' as const },
      { delay: duration * 0.8, intensity: 'heavy' as const },
    ];
    
    // Schedule progressive haptic feedback
    hapticProgression.forEach(({ delay, intensity }) => {
      const timer = setTimeout(() => {
        triggerHaptic(intensity, 'longPress');
      }, delay);
      longPressProgress.current.push(timer);
    });
    
    // Trigger action after threshold
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('achievement', 'longPress');
      setLongPressActive(null);
      action();
    }, duration);
  };

  const handleLongPressStartContextMenu = (videoId: string, e: React.MouseEvent | React.TouchEvent) => {
    // Check if long-press haptics are enabled
    if (!hapticSettings.enabled || !hapticSettings.enabledTypes.longPress) {
      return;
    }
    
    // Clear any existing timers
    clearLongPress();
    
    setLongPressActive(`context-${videoId}`);
    
    // Get position for context menu
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const duration = hapticSettings.longPressDuration;
    
    // Progressive haptic feedback at intervals scaled to duration
    const hapticProgression = [
      { delay: 0, intensity: 'light' as const },
      { delay: duration * 0.2, intensity: 'light' as const },
      { delay: duration * 0.4, intensity: 'medium' as const },
      { delay: duration * 0.6, intensity: 'medium' as const },
      { delay: duration * 0.8, intensity: 'heavy' as const },
    ];
    
    // Schedule progressive haptic feedback
    hapticProgression.forEach(({ delay, intensity }) => {
      const timer = setTimeout(() => {
        triggerHaptic(intensity, 'longPress');
      }, delay);
      longPressProgress.current.push(timer);
    });
    
    // Show context menu after threshold
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('achievement', 'longPress');
      setLongPressActive(null);
      setContextMenu({ videoId, x: clientX, y: clientY });
    }, duration);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    longPressProgress.current.forEach(timer => clearTimeout(timer));
    longPressProgress.current = [];
    
    setLongPressActive(null);
  };

  const handleLongPressEnd = () => {
    clearLongPress();
  };

  const handleContextMenuAction = async (action: string, videoId: string) => {
    triggerHaptic('medium', 'interactions');
    setContextMenu(null);
    
    switch (action) {
      case 'save':
        setSelectedCollectionVideo(videoId);
        setAddToCollectionDialogOpen(true);
        break;
      case 'report':
        toast.info('Report functionality coming soon');
        break;
      case 'notInterested':
        toast.success('Marked as not interested');
        break;
      case 'delete':
        await handleDeleteVideo(videoId);
        break;
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!currentUser) {
      toast.error("Please login to delete videos");
      return;
    }

    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId)
        .eq("user_id", currentUser);

      if (error) throw error;

      // Remove from state
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setFollowingVideos(prev => prev.filter(v => v.id !== videoId));

      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleShare = async (videoId: string) => {
    await triggerHaptic('light', 'interactions');
    
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
        
        // Update follower count
        setFollowerCounts(prev => ({
          ...prev,
          [userId]: Math.max((prev[userId] || 1) - 1, 0)
        }));
        
        toast.success("Unfollowed");
      } else {
        const { error} = await supabase
          .from("follows")
          .insert({ follower_id: currentUser, followed_id: userId });

        if (error) throw error;
        setFollowedUsers(prev => new Set(prev).add(userId));
        
        // Update follower count
        setFollowerCounts(prev => ({
          ...prev,
          [userId]: (prev[userId] || 0) + 1
        }));
        
        // Show success animation
        setJustFollowed(userId);
        setTimeout(() => setJustFollowed(null), 2000);
        
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
      triggerHaptic('medium', 'navigation');
      const container = videoContainerRefs.current.get(miniPlayerVideo.video.id);
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setMiniPlayerVideo(null);
      }
    }
  };

  const handleCloseMiniPlayer = () => {
    triggerHaptic('light', 'navigation');
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
    <div
      key={video.id}
      ref={(el) => setVideoContainerRef(video.id, el)}
      className="relative flex h-[100vh] w-full items-center justify-center bg-black snap-start snap-always"
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

      {/* Inner video frame - limited width on desktop */}
      <div className="relative h-full w-full max-w-[430px] flex items-center justify-center">
        {video.video_url.includes('youtube.com/embed') || video.video_url.includes('youtu.be') ? (
          <iframe
            ref={(el) => setVideoRef(video.id, el as any)}
            data-video-id={video.id}
            src={(() => {
              // Extract video ID from URL
              let videoId = '';
              if (video.video_url.includes('youtube.com/embed/')) {
                videoId = video.video_url.split('youtube.com/embed/')[1].split('?')[0];
              } else if (video.video_url.includes('youtu.be/')) {
                videoId = video.video_url.split('youtu.be/')[1].split('?')[0];
              }
              
              // Build privacy-enhanced YouTube embed URL with enablejsapi for programmatic control
              const baseUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
              const params = new URLSearchParams({
                autoplay: playingVideos.has(video.id) ? '1' : '0',
                mute: mutedVideos.has(video.id) ? '1' : '0',
                loop: '1',
                playlist: videoId,
                controls: '1',
                modestbranding: '1',
                rel: '0',
                playsinline: '1',
                enablejsapi: '1',
                origin: window.location.origin,
              });
              return `${baseUrl}?${params.toString()}`;
            })()}
            className="h-screen md:h-auto md:max-h-[85vh] w-full md:w-auto md:max-w-full object-contain md:rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={(el) => setVideoRef(video.id, el as HTMLVideoElement | null)}
            data-video-id={video.id}
            src={video.video_url}
            className="h-screen md:h-auto md:max-h-[85vh] w-full md:w-auto md:max-w-full object-contain md:rounded-2xl bg-black"
            muted={mutedVideos.has(video.id)}
            playsInline
            loop
            preload="none"
            onError={(e) => {
              console.error(`[Feed] Video error for ${video.id}:`, {
                error: e.currentTarget.error,
                src: video.video_url,
                networkState: e.currentTarget.networkState,
                readyState: e.currentTarget.readyState
              });
              
              // Set a black background on error to prevent white screen
              e.currentTarget.style.backgroundColor = 'black';
              e.currentTarget.style.opacity = '0';
              
              // Track error state (debounced)
              setVideoErrors(prev => {
                if (prev.has(video.id)) return prev;
                
                const next = new Set(prev);
                next.add(video.id);
                
                triggerHaptic('error', 'errors');
                
                // Clear error after 5 seconds
                setTimeout(() => {
                  setVideoErrors(current => {
                    const updated = new Set(current);
                    updated.delete(video.id);
                    return updated;
                  });
                }, 5000);
                
                return next;
              });
            }}
            onLoadedData={(e) => {
              // Ensure video is visible once loaded
              e.currentTarget.style.opacity = '1';
              console.log(`[Feed] Video ${video.id} loaded successfully`);
            }}
            onLoadStart={() => {
              // Ensure black background during loading
              const videoEl = videoRefs.current.get(video.id);
              if (videoEl) {
                videoEl.style.backgroundColor = 'black';
                videoEl.style.transition = 'opacity 0.3s ease-in-out';
              }
            }}
          />
        )}

        {/* Tap anywhere on video to play/pause - only for regular videos, not YouTube */}
        {!(video.video_url.includes('youtube.com/embed') || video.video_url.includes('youtu.be')) && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              const vid = videoRefs.current.get(video.id);
              if (!vid) return;

              if (playingVideos.has(video.id)) {
                vid.pause();
                setPlayingVideos((prev) => {
                  const next = new Set(prev);
                  next.delete(video.id);
                  return next;
                });
              } else {
                vid.play();
                setPlayingVideos((prev) => new Set(prev).add(video.id));
              }
            }}
            className="absolute inset-0 z-[5] cursor-pointer"
          >
            {/* PLAY BUTTON - Centered, only shown when paused */}
            {!playingVideos.has(video.id) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/30 backdrop-blur-sm rounded-full p-4">
                  <Play className="h-16 w-16 text-white/90 fill-white/90" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* MUTE BUTTON - Top Left - only for regular videos, not YouTube */}
        {!(video.video_url.includes('youtube.com/embed') || video.video_url.includes('youtu.be')) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
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
            className="absolute top-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 bg-black/60 p-2 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors z-[50]"
          >
            {mutedVideos.has(video.id) ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
        )}

        {/* Double-tap heart animation */}
        {doubleTapHearts.has(video.id) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500" />
          </motion.div>
        )}

        {/* Success checkmark overlay for follow */}
        {justFollowed === video.user_id && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-primary rounded-full h-20 w-20 flex items-center justify-center shadow-lg">
              <motion.svg
                className="h-10 w-10 text-primary-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              >
                <motion.path d="M20 6L9 17l-5-5" />
              </motion.svg>
            </div>
          </motion.div>
        )}

        {/* Caption overlay */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-4 pointer-events-none z-10">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-sm">@{video.username}</p>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Play className="h-3 w-3 fill-white/80" />
                <span>{video.views.toLocaleString()} views</span>
              </div>
            </div>
            {video.caption && (
              <p className="text-white/90 text-sm line-clamp-2">{video.caption}</p>
            )}
          </div>
        </div>

        {/* ========================== */}
        {/*     DESKTOP RIGHT RAIL      */}
        {/* ========================== */}
        <div className="hidden md:flex flex-col gap-5 absolute right-[-72px] bottom-24 z-20">
          {/* PROFILE / FOLLOW BUTTON */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentUser && video.user_id !== currentUser) {
                handleFollow(video.user_id);
              }
            }}
            className="relative h-16 w-16 overflow-hidden rounded-full border border-white/30 bg-black/40 backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-transform"
          >
            {video.avatar_url ? (
              <img
                src={video.avatar_url}
                alt={video.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserPlus className="h-7 w-7 text-white opacity-80" />
            )}

            {/* PLUS BADGE (only if not following) */}
            {currentUser && video.user_id !== currentUser && !followedUsers.has(video.user_id) && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white shadow-md">
                +
              </span>
            )}
          </button>

          {/* LIKE BUTTON */}
          <button
            onClick={() => handleLike(video.id)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white flex flex-col items-center hover:scale-105 transition-transform"
          >
            <Heart className={`h-7 w-7 ${likedVideos.has(video.id) ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-xs mt-1">{video.likes}</span>
          </button>

          {/* COMMENT BUTTON */}
          <button
            onClick={() => {
              triggerHaptic('medium', 'interactions');
              setSelectedVideoId(video.id);
            }}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white flex flex-col items-center hover:scale-105 transition-transform"
          >
            <MessageCircle className="h-7 w-7" />
            <span className="text-xs mt-1">{commentCounts[video.id] || 0}</span>
          </button>

          {/* BOOKMARK BUTTON */}
          <button
            onClick={() => handleBookmark(video.id)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:scale-105 transition-transform"
          >
            <Bookmark className={`h-7 w-7 ${bookmarkedVideos.has(video.id) ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>

          {/* SHARE BUTTON */}
          <button
            onClick={() => handleShare(video.id)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:scale-105 transition-transform"
          >
            <Share2 className="h-7 w-7" />
          </button>

          {/* MORE ACTIONS DROPDOWN - only for own videos */}
          {currentUser && video.user_id === currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:scale-105 transition-transform">
                  <MoreHorizontal className="h-7 w-7" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="left"
                className="w-48 bg-background border-border z-[60]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info('Edit functionality coming soon');
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPromoteVideo(video);
                    setPromoteDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Promote
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGiftVideo(video);
                    setGiftDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Gift
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVideo(video.id);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* =========================== */}
      {/*   MOBILE ACTIONS OVERLAY    */}
      {/* =========================== */}
      <div className="absolute inset-0 md:hidden pointer-events-none flex flex-col justify-between px-4 py-6">
        <div className="pointer-events-auto ml-auto flex flex-col items-center gap-4">
          {/* PROFILE / FOLLOW BUTTON */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentUser && video.user_id !== currentUser) {
                handleFollow(video.user_id);
              }
            }}
            className="relative h-14 w-14 overflow-hidden rounded-full border border-white/30 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            {video.avatar_url ? (
              <img
                src={video.avatar_url}
                alt={video.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserPlus className="h-6 w-6 text-white opacity-80" />
            )}
            {currentUser && video.user_id !== currentUser && !followedUsers.has(video.user_id) && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-md">
                +
              </span>
            )}
          </button>

          {/* LIKE BUTTON */}
          <button
            onClick={() => handleLike(video.id)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white flex flex-col items-center"
          >
            <Heart className={`h-6 w-6 ${likedVideos.has(video.id) ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-xs mt-1">{video.likes}</span>
          </button>

          {/* COMMENT BUTTON */}
          <button
            onClick={() => {
              triggerHaptic('medium', 'interactions');
              setSelectedVideoId(video.id);
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white flex flex-col items-center"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs mt-1">{commentCounts[video.id] || 0}</span>
          </button>

          {/* BOOKMARK BUTTON */}
          <button
            onClick={() => handleBookmark(video.id)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <Bookmark className={`h-6 w-6 ${bookmarkedVideos.has(video.id) ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>

          {/* SHARE BUTTON */}
          <button
            onClick={() => handleShare(video.id)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
          >
            <Share2 className="h-6 w-6" />
          </button>

          {/* MORE ACTIONS DROPDOWN - only for own videos */}
          {currentUser && video.user_id === currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white">
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="left"
                className="w-48 bg-background border-border z-[60]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info('Edit functionality coming soon');
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPromoteVideo(video);
                    setPromoteDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Promote
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGiftVideo(video);
                    setGiftDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Gift
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVideo(video.id);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
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
      <Tabs value={activeTab} onValueChange={(value) => {
        triggerHaptic('light', 'navigation');
        setActiveTab(value);
      }}>
        {/* Tab switcher and settings - floating at top */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          <TabsList className="bg-background/80 backdrop-blur-sm">
            <TabsTrigger value="forYou">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          {/* Feed Settings Dialog */}
          <FeedSettingsDialog
            desktopLayoutMode={desktopLayoutMode}
            onLayoutModeChange={(mode) => {
              setDesktopLayoutMode(mode);
              localStorage.setItem('feed-desktop-layout', mode);
            }}
            autoPlay={autoPlay}
            onAutoPlayChange={(enabled) => {
              setAutoPlay(enabled);
              localStorage.setItem('feed-auto-play', String(enabled));
            }}
            videoQuality={videoQuality}
            onVideoQualityChange={setVideoQuality}
            triggerHaptic={triggerHaptic}
          />
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
        onClose={() => {
          triggerHaptic('light', 'navigation');
          setSelectedVideoId(null);
        }}
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

      {selectedGiftVideo && (
        <SendGiftDialog
          open={giftDialogOpen}
          onOpenChange={setGiftDialogOpen}
          recipientId={selectedGiftVideo.user_id}
          recipientUsername={selectedGiftVideo.username}
        />
      )}
      
      <AddToCollectionDialog
        open={addToCollectionDialogOpen}
        onClose={() => {
          setAddToCollectionDialogOpen(false);
          setSelectedCollectionVideo(null);
          // Refresh bookmarked videos state
          if (currentUser) {
            fetchBookmarks(currentUser);
          }
        }}
        videoId={selectedCollectionVideo || ""}
        currentUser={currentUser}
      />
      
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
                <Button size="rounded-sm" onClick={addChapter} disabled={!newChapterLabel.trim()}>
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
                              size="rounded-sm"
                              variant="ghost"
                              onClick={() => updateChapterLabel(chapter.id, editingChapter.label)}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="rounded-sm"
                              variant="ghost"
                              onClick={() => setEditingChapter(chapter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="rounded-sm"
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
            <Button size="rounded" variant="outline" onClick={() => setChaptersDialogOpen(false)}>
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
                size="rounded-sm"
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
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Jump to specific % (0-9)</span>
                    <div className="flex gap-1">
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">0-9</kbd>
                    </div>
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
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Toggle Picture-in-Picture</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">P</kbd>
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
            
            {/* Error Indicator - Mini Player */}
            {videoErrors.has(miniPlayerVideo.video.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="flex flex-col items-center gap-2 scale-75">
                  <div className="bg-destructive/20 backdrop-blur-md rounded-full p-3">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="text-destructive text-xs font-semibold">Error</p>
                </div>
              </div>
            )}
            
            {/* Buffering Indicator - Mini Player */}
            {bufferingVideos.has(miniPlayerVideo.video.id) && !videoErrors.has(miniPlayerVideo.video.id) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-in">
                <div className="bg-background/20 backdrop-blur-md rounded-full p-3">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              </div>
            )}
            
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => {
              triggerHaptic('light', 'navigation');
              setContextMenu(null);
            }}
          />
          
          {/* Context menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 220),
              top: Math.min(contextMenu.y, window.innerHeight - 200),
            }}
          >
            <div className="py-2">
              {/* Save to Collection */}
              <button
                onClick={() => handleContextMenuAction('save', contextMenu.videoId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <Bookmark className="h-5 w-5 text-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {bookmarkedVideos.has(contextMenu.videoId) ? 'Remove Bookmark' : 'Save to Collection'}
                </span>
              </button>

              {/* Delete (only for own videos) */}
              {(() => {
                const video = videos.find(v => v.id === contextMenu.videoId) || 
                              followingVideos.find(v => v.id === contextMenu.videoId);
                return video?.user_id === currentUser && (
                  <button
                    onClick={() => handleContextMenuAction('delete', contextMenu.videoId)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Delete</span>
                  </button>
                );
              })()}

              {/* Report */}
              <button
                onClick={() => handleContextMenuAction('report', contextMenu.videoId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-foreground">Report</span>
              </button>

              {/* Not Interested */}
              <button
                onClick={() => handleContextMenuAction('notInterested', contextMenu.videoId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Not Interested</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
