import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Bookmark, Share2, UserPlus, UserMinus, TrendingUp, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles, Settings, X, PictureInPicture, ListVideo, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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

type VideoPost = {
  id: string;
  video_url: string;
  caption: string;
  username: string;
  user_id: string;
  likes: number;
  views: number;
  comments?: number;
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

  // Preload first video on mount for immediate playback
  useEffect(() => {
    const currentVideos = activeTab === "following" ? followingVideos : videos;
    if (currentVideos.length > 0) {
      const firstVideoId = currentVideos[0].id;
      const firstVideo = videoRefs.current.get(firstVideoId);
      if (firstVideo) {
        firstVideo.preload = 'auto';
        firstVideo.load();
      }
    }
  }, [videos, followingVideos, activeTab]);

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

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (videoElement.paused) {
            videoElement.play();
            setPlayingVideos((prev) => new Set(prev).add(currentVisibleVideoId));
          } else {
            videoElement.pause();
            setPlayingVideos((prev) => {
              const next = new Set(prev);
              next.delete(currentVisibleVideoId);
              return next;
            });
          }
          break;
        
        case 'KeyM':
          e.preventDefault();
          setMutedVideos((prev) => {
            const next = new Set(prev);
            if (next.has(currentVisibleVideoId)) {
              next.delete(currentVisibleVideoId);
              videoElement.muted = false;
            } else {
              next.add(currentVisibleVideoId);
              videoElement.muted = true;
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
          } else {
            if (videoContainer.requestFullscreen) {
              videoContainer.requestFullscreen();
            }
            setFullscreenVideoId(currentVisibleVideoId);
          }
          break;
        
        case 'ArrowLeft':
          e.preventDefault();
          videoElement.currentTime = Math.max(0, videoElement.currentTime - 5);
          break;
        
        case 'ArrowRight':
          e.preventDefault();
          videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 5);
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          videoElement.volume = Math.min(1, videoElement.volume + 0.1);
          break;
        
        case 'ArrowDown':
          e.preventDefault();
          videoElement.volume = Math.max(0, videoElement.volume - 0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVisibleVideoId, showShortcuts, playingVideos, fullscreenVideoId, mutedVideos]);

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
      setVideos(data || []);
      
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
      setFollowingVideos(data || []);
      
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

      const { error } = await supabase
        .from("videos")
        .update({ likes: video.likes + 1 })
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
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/video/${videoId}`
      );
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Error sharing video:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    try {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg shadow-lg overflow-hidden mb-6"
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
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold">{video.username[0].toUpperCase()}</span>
            </div>
            <span className="font-semibold">{video.username}</span>
          </div>
          {currentUser && video.user_id !== currentUser && (
            <Button
              variant={followedUsers.has(video.user_id) ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollow(video.user_id)}
            >
              {followedUsers.has(video.user_id) ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm mb-3">{video.caption}</p>
      </div>

      {/* Mobile: Video with actions on the right side */}
      <div className="relative md:static">
        <div
          className="relative"
          onClick={() => handleDoubleTap(video.id)}
          onTouchEnd={() => handleDoubleTap(video.id)}
        >
          <video
            ref={(el) => setVideoRef(video.id, el)}
            data-video-id={video.id}
            src={video.video_url}
            className="w-full aspect-video object-cover"
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
                          Auto (Currently: {currentQuality})
                        </SelectItem>
                        <SelectItem value="360p">360p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      </SelectContent>
                    </Select>
                    {autoQualityEnabled && (
                      <p className="text-xs text-muted-foreground">
                        Network: {networkSpeed === 'fast' ? '🟢 Fast' : networkSpeed === 'medium' ? '🟡 Medium' : '🔴 Slow'}
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
        
        {/* Mobile action buttons - right side */}
        <div className="absolute right-2 bottom-20 flex flex-col gap-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLike(video.id)}
            className={`bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0 ${likedVideos.has(video.id) ? "text-red-500" : ""}`}
          >
            <div className="flex flex-col items-center">
              <Heart
                className={`h-6 w-6 ${likedVideos.has(video.id) ? "fill-current" : ""}`}
              />
              <span className="text-xs">{video.likes}</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedVideoId(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0"
          >
            <div className="flex flex-col items-center">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">{commentCounts[video.id] || 0}</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBookmark(video.id)}
            className={`bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0 ${bookmarkedVideos.has(video.id) ? "text-primary" : ""}`}
          >
            <Bookmark
              className={`h-6 w-6 ${bookmarkedVideos.has(video.id) ? "fill-current" : ""}`}
            />
          </Button>

          {currentUser && video.user_id !== currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFollow(video.user_id)}
              className={`bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0 ${followedUsers.has(video.user_id) ? "text-primary" : ""}`}
            >
              {followedUsers.has(video.user_id) ? (
                <UserMinus className="h-6 w-6" />
              ) : (
                <UserPlus className="h-6 w-6" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShare(video.id)}
            className="bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0"
          >
            <Share2 className="h-6 w-6" />
          </Button>

          {currentUser && video.user_id === currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPromoteVideo(video);
                setPromoteDialogOpen(true);
              }}
              className="bg-background/80 backdrop-blur-sm rounded-full h-12 w-12 p-0 text-primary"
            >
              <TrendingUp className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop action buttons - below video */}
      <div className="p-4 hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(video.id)}
              className={likedVideos.has(video.id) ? "text-red-500" : ""}
            >
              <Heart
                className={`h-5 w-5 ${likedVideos.has(video.id) ? "fill-current" : ""}`}
              />
              <span className="ml-1">{video.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVideoId(video.id)}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="ml-1">{commentCounts[video.id] || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => handleShare(video.id)}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            {currentUser && video.user_id === currentUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPromoteVideo(video);
                  setPromoteDialogOpen(true);
                }}
                className="text-primary"
              >
                <TrendingUp className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBookmark(video.id)}
              className={bookmarkedVideos.has(video.id) ? "text-primary" : ""}
            >
              <Bookmark
                className={`h-5 w-5 ${bookmarkedVideos.has(video.id) ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>
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
      className="min-h-screen bg-background overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://voice2fire.com/" },
          { name: "Feed", url: "https://voice2fire.com/feed" }
        ]}
      />
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">🔥 Video Feed</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forYou">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="forYou" className="mt-6">
            {loading ? (
              <div className="text-center py-12">Loading amazing content...</div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No videos yet</div>
            ) : (
              videos.map(renderVideoCard)
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            {!currentUser ? (
              <div className="text-center py-12 text-muted-foreground">
                Please login to see videos from people you follow
              </div>
            ) : followingVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No videos from followed users yet. Start following creators!
              </div>
            ) : (
              followingVideos.map(renderVideoCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

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
                    <span className="text-muted-foreground">Volume up</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">↑</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Volume down</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">↓</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Toggle fullscreen</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold bg-muted rounded">F</kbd>
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
