import { useState, useRef, useEffect } from "react";
import { Settings, Layers, LayoutPanelTop, Volume2, Gauge, Vibrate, RotateCcw, Download, Upload, Save, Trash2, Check, Share2, Tag, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useHapticSettings } from "@/hooks/useHapticSettings";
import { cn } from "@/lib/utils";

type SettingsProfile = {
  name: string;
  desktopLayoutMode: 'side-panel' | 'overlay';
  autoPlay: boolean;
  videoQuality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  haptics: any;
  tags: string[];
};

const AVAILABLE_TAGS = [
  'Gaming',
  'Work',
  'Travel',
  'Cinema',
  'Data Saver',
  'High Quality',
  'Mobile',
  'Desktop',
] as const;

type FeedSettingsProps = {
  desktopLayoutMode: 'side-panel' | 'overlay';
  onLayoutModeChange: (mode: 'side-panel' | 'overlay') => void;
  autoPlay: boolean;
  onAutoPlayChange: (enabled: boolean) => void;
  videoQuality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  onVideoQualityChange: (quality: 'auto' | '360p' | '480p' | '720p' | '1080p') => void;
  triggerHaptic?: (style: string, category: string) => void;
};

const STORAGE_KEY_PROFILES = 'feed-settings-profiles';
const STORAGE_KEY_CURRENT_PROFILE = 'feed-settings-current-profile';

export function FeedSettingsDialog({
  desktopLayoutMode,
  onLayoutModeChange,
  autoPlay,
  onAutoPlayChange,
  videoQuality,
  onVideoQualityChange,
  triggerHaptic,
}: FeedSettingsProps) {
  const [open, setOpen] = useState(false);
  const { settings: hapticSettings, updateSettings: updateHapticSettings, resetSettings } = useHapticSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profiles state
  const [profiles, setProfiles] = useState<SettingsProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProfile, setCurrentProfile] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENT_PROFILE);
  });
  const [newProfileName, setNewProfileName] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  // Save current profile to localStorage
  useEffect(() => {
    if (currentProfile) {
      localStorage.setItem(STORAGE_KEY_CURRENT_PROFILE, currentProfile);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_PROFILE);
    }
  }, [currentProfile]);

  // Check for shared profile in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProfile = urlParams.get('profile');
    
    if (sharedProfile) {
      try {
        const decodedData = atob(sharedProfile);
        const profileData = JSON.parse(decodedData);
        
        // Apply the shared settings
        if (profileData.desktopLayoutMode) {
          onLayoutModeChange(profileData.desktopLayoutMode);
        }
        if (profileData.autoPlay !== undefined) {
          onAutoPlayChange(profileData.autoPlay);
        }
        if (profileData.videoQuality) {
          onVideoQualityChange(profileData.videoQuality);
        }
        if (profileData.haptics) {
          updateHapticSettings(profileData.haptics);
        }
        
        toast.success('Shared profile loaded successfully');
        triggerHaptic?.('medium', 'interactions');
        
        // Remove the profile parameter from URL
        urlParams.delete('profile');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Error loading shared profile:', error);
        toast.error('Failed to load shared profile');
      }
    }
  }, []);

  const handleLayoutChange = (newMode: 'side-panel' | 'overlay') => {
    onLayoutModeChange(newMode);
    toast.success(
      newMode === 'side-panel' 
        ? 'Side panel layout enabled' 
        : 'Overlay layout enabled'
    );
    triggerHaptic?.('light', 'interactions');
  };

  const handleAutoPlayChange = (enabled: boolean) => {
    onAutoPlayChange(enabled);
    toast.success(enabled ? 'Auto-play enabled' : 'Auto-play disabled');
    triggerHaptic?.('light', 'interactions');
  };

  const handleQualityChange = (quality: 'auto' | '360p' | '480p' | '720p' | '1080p') => {
    onVideoQualityChange(quality);
    toast.success(`Video quality set to ${quality === 'auto' ? 'Auto' : quality}`);
    triggerHaptic?.('light', 'interactions');
  };

  const handleHapticCategoryToggle = (category: 'interactions' | 'navigation' | 'errors') => {
    updateHapticSettings({
      ...hapticSettings,
      enabledTypes: {
        ...hapticSettings.enabledTypes,
        [category]: !hapticSettings.enabledTypes[category],
      },
    });
    triggerHaptic?.('light', 'interactions');
  };

  const handleResetToDefaults = () => {
    // Reset all settings to defaults
    onLayoutModeChange('side-panel');
    onAutoPlayChange(true);
    onVideoQualityChange('auto');
    resetSettings();
    
    toast.success('All settings reset to defaults');
    triggerHaptic?.('medium', 'interactions');
  };

  const handleExportSettings = () => {
    const settingsData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        desktopLayoutMode,
        autoPlay,
        videoQuality,
        haptics: hapticSettings,
      },
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feed-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Settings exported successfully');
    triggerHaptic?.('light', 'interactions');
  };

  const handleImportSettings = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the settings structure
        if (!data.settings) {
          throw new Error('Invalid settings file format');
        }

        // Apply the imported settings
        if (data.settings.desktopLayoutMode) {
          onLayoutModeChange(data.settings.desktopLayoutMode);
        }
        if (data.settings.autoPlay !== undefined) {
          onAutoPlayChange(data.settings.autoPlay);
        }
        if (data.settings.videoQuality) {
          onVideoQualityChange(data.settings.videoQuality);
        }
        if (data.settings.haptics) {
          updateHapticSettings(data.settings.haptics);
        }

        toast.success('Settings imported successfully');
        triggerHaptic?.('medium', 'interactions');
      } catch (error) {
        console.error('Error importing settings:', error);
        toast.error('Failed to import settings. Please check the file format.');
        triggerHaptic?.('heavy', 'errors');
      }
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    if (profiles.some(p => p.name === newProfileName.trim())) {
      toast.error('A profile with this name already exists');
      return;
    }

    const newProfile: SettingsProfile = {
      name: newProfileName.trim(),
      desktopLayoutMode,
      autoPlay,
      videoQuality,
      haptics: hapticSettings,
      tags: selectedTags,
    };

    setProfiles([...profiles, newProfile]);
    setCurrentProfile(newProfile.name);
    setNewProfileName('');
    setSelectedTags([]);
    setShowProfileForm(false);
    toast.success(`Profile "${newProfile.name}" saved`);
    triggerHaptic?.('medium', 'interactions');
  };

  const handleLoadProfile = (profile: SettingsProfile) => {
    onLayoutModeChange(profile.desktopLayoutMode);
    onAutoPlayChange(profile.autoPlay);
    onVideoQualityChange(profile.videoQuality);
    updateHapticSettings(profile.haptics);
    setCurrentProfile(profile.name);
    toast.success(`Profile "${profile.name}" loaded`);
    triggerHaptic?.('medium', 'interactions');
  };

  const handleDeleteProfile = (profileName: string) => {
    setProfiles(profiles.filter(p => p.name !== profileName));
    if (currentProfile === profileName) {
      setCurrentProfile(null);
    }
    toast.success(`Profile "${profileName}" deleted`);
    triggerHaptic?.('light', 'interactions');
  };

  const handleUpdateCurrentProfile = () => {
    if (!currentProfile) return;

    const currentProfileData = profiles.find(p => p.name === currentProfile);
    const updatedProfiles = profiles.map(p => 
      p.name === currentProfile
        ? {
            ...p,
            desktopLayoutMode,
            autoPlay,
            videoQuality,
            haptics: hapticSettings,
            tags: currentProfileData?.tags || [],
          }
        : p
    );

    setProfiles(updatedProfiles);
    toast.success(`Profile "${currentProfile}" updated`);
    triggerHaptic?.('light', 'interactions');
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredProfiles = profiles.filter(profile => {
    // Filter by tag if selected
    const matchesTag = filterTag ? profile.tags?.includes(filterTag) : true;
    
    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' 
      ? true 
      : profile.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTag && matchesSearch;
  });

  const handleShareProfile = (profile: SettingsProfile) => {
    try {
      const profileData = {
        desktopLayoutMode: profile.desktopLayoutMode,
        autoPlay: profile.autoPlay,
        videoQuality: profile.videoQuality,
        haptics: profile.haptics,
      };
      
      const encodedData = btoa(JSON.stringify(profileData));
      const shareUrl = `${window.location.origin}${window.location.pathname}?profile=${encodedData}`;
      
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
      triggerHaptic?.('light', 'interactions');
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Failed to generate share link');
      triggerHaptic?.('heavy', 'errors');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
          title="Feed Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Feed Settings</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportSettings}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                title="Export settings"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportSettings}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                title="Import settings"
              >
                <Upload className="h-3 w-3" />
                Import
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefaults}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                title="Reset to defaults"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Customize your feed viewing experience
          </DialogDescription>
        </DialogHeader>

        {/* Hidden file input for importing */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="space-y-6 py-4">
          {/* Profiles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Profiles</h3>
                {currentProfile && (
                  <Badge variant="secondary" className="text-xs">
                    {currentProfile}
                  </Badge>
                )}
              </div>
              {currentProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUpdateCurrentProfile}
                  className="h-7 text-xs gap-1"
                >
                  <Check className="h-3 w-3" />
                  Update
                </Button>
              )}
            </div>

            {/* Search and Filter */}
            {profiles.length > 0 && (
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Tag Filter */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Filter by tag:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant={filterTag === null ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterTag(null)}
                      className="h-6 text-xs px-2"
                    >
                      All
                    </Button>
                    {Array.from(new Set(profiles.flatMap(p => p.tags || []))).map(tag => (
                      <Button
                        key={tag}
                        variant={filterTag === tag ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setFilterTag(tag)}
                        className="h-6 text-xs px-2"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {filteredProfiles.length > 0 && (
              <ScrollArea className="h-[120px] rounded-md border bg-muted/30 p-3">
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <div
                      key={profile.name}
                      className={cn(
                        "flex flex-col gap-2 p-2 rounded-md transition-colors",
                        currentProfile === profile.name
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleLoadProfile(profile)}
                          className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
                        >
                          {profile.name}
                          {currentProfile === profile.name && (
                            <Check className="inline-block ml-2 h-3 w-3 text-primary" />
                          )}
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareProfile(profile)}
                            className="h-7 w-7 p-0 hover:text-primary"
                            title="Copy share link"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.name)}
                            className="h-7 w-7 p-0 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {profile.tags && profile.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-[10px] h-4 px-1.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {profiles.length > 0 && filteredProfiles.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {searchQuery && filterTag 
                  ? `No profiles matching "${searchQuery}" with "${filterTag}" tag`
                  : searchQuery 
                    ? `No profiles matching "${searchQuery}"`
                    : `No profiles with "${filterTag}" tag`
                }
              </div>
            )}

            {showProfileForm ? (
              <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                <Input
                  placeholder="Profile name (e.g., High Quality)"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProfileName.trim()) {
                      handleSaveProfile();
                    } else if (e.key === 'Escape') {
                      setShowProfileForm(false);
                      setNewProfileName('');
                      setSelectedTags([]);
                    }
                  }}
                  autoFocus
                />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tags (optional):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleToggleTag(tag)}
                        className="h-6 text-xs px-2"
                      >
                        {tag}
                        {selectedTags.includes(tag) && (
                          <X className="ml-1 h-2.5 w-2.5" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    className="flex-1 gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowProfileForm(false);
                      setNewProfileName('');
                      setSelectedTags([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileForm(true)}
                className="w-full gap-2"
              >
                <Save className="h-3 w-3" />
                Save Current as New Profile
              </Button>
            )}
          </div>

          <Separator />

          {/* Desktop Layout Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Desktop Layout</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="layout-mode" className="text-sm">
                  Layout Mode
                </Label>
                <Select
                  value={desktopLayoutMode}
                  onValueChange={handleLayoutChange}
                >
                  <SelectTrigger id="layout-mode" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side-panel">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3 w-3" />
                        Side Panel
                      </div>
                    </SelectItem>
                    <SelectItem value="overlay">
                      <div className="flex items-center gap-2">
                        <LayoutPanelTop className="h-3 w-3" />
                        Overlay
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {desktopLayoutMode === 'side-panel' 
                  ? 'Action buttons appear beside the video on desktop'
                  : 'Action buttons overlay the video like mobile view'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Playback Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Playback</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-play" className="text-sm">
                    Auto-play videos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically play videos as you scroll
                  </p>
                </div>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={handleAutoPlayChange}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Video Quality Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Video Quality</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="video-quality" className="text-sm">
                  Default Quality
                </Label>
                <Select
                  value={videoQuality}
                  onValueChange={handleQualityChange}
                >
                  <SelectTrigger id="video-quality" className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto - Adaptive</SelectItem>
                    <SelectItem value="360p">360p</SelectItem>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {videoQuality === 'auto' 
                  ? 'Quality adjusts based on your connection speed'
                  : `Videos will play in ${videoQuality} when available`}
              </p>
            </div>
          </div>

          <Separator />

          {/* Haptic Feedback Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Vibrate className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Haptic Feedback</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="haptic-master" className="text-sm">
                    Enable Haptics
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Master switch for all haptic feedback
                  </p>
                </div>
                <Switch
                  id="haptic-master"
                  checked={hapticSettings.enabled}
                  onCheckedChange={(enabled) => {
                    updateHapticSettings({ ...hapticSettings, enabled });
                    triggerHaptic?.('light', 'interactions');
                  }}
                />
              </div>

              {hapticSettings.enabled && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground">Categories</p>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="haptic-interactions" className="text-xs">
                      Interactions
                    </Label>
                    <Switch
                      id="haptic-interactions"
                      checked={hapticSettings.enabledTypes.interactions}
                      onCheckedChange={() => handleHapticCategoryToggle('interactions')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="haptic-navigation" className="text-xs">
                      Navigation
                    </Label>
                    <Switch
                      id="haptic-navigation"
                      checked={hapticSettings.enabledTypes.navigation}
                      onCheckedChange={() => handleHapticCategoryToggle('navigation')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="haptic-errors" className="text-xs">
                      Errors
                    </Label>
                    <Switch
                      id="haptic-errors"
                      checked={hapticSettings.enabledTypes.errors}
                      onCheckedChange={() => handleHapticCategoryToggle('errors')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
