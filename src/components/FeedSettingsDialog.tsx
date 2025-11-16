import { useState, useRef } from "react";
import { Settings, Layers, LayoutPanelTop, Volume2, Gauge, Vibrate, RotateCcw, Download, Upload } from "lucide-react";
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
  const { settings: hapticSettings, updateSettings: updateHapticSettings, resetSettings } = useHapticSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
