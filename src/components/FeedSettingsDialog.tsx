import { useState } from "react";
import { Settings, Layers, LayoutPanelTop, Volume2, Gauge, Vibrate } from "lucide-react";
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
import { toast } from "sonner";
import { useHapticSettings } from "@/hooks/useHapticSettings";

type FeedSettingsProps = {
  desktopLayoutMode: 'side-panel' | 'overlay';
  onLayoutModeChange: (mode: 'side-panel' | 'overlay') => void;
  autoPlay: boolean;
  onAutoPlayChange: (enabled: boolean) => void;
  videoQuality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  onVideoQualityChange: (quality: 'auto' | '360p' | '480p' | '720p' | '1080p') => void;
  triggerHaptic?: (style: string, category: string) => void;
};

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
  const { settings: hapticSettings, updateSettings: updateHapticSettings } = useHapticSettings();

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
          <DialogTitle>Feed Settings</DialogTitle>
          <DialogDescription>
            Customize your feed viewing experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
