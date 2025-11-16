import { Settings, Vibrate, Zap, Trophy, AlertCircle, Navigation, Hand } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useHapticSettings } from "@/hooks/useHapticSettings";
import { toast } from "sonner";
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function HapticSettings() {
  const { settings, updateSettings, updateEnabledType, resetSettings } = useHapticSettings();

  const testHaptic = async (intensity: 'light' | 'medium' | 'strong') => {
    try {
      const style = intensity === 'light' ? ImpactStyle.Light 
                  : intensity === 'medium' ? ImpactStyle.Medium 
                  : ImpactStyle.Heavy;
      await Haptics.impact({ style });
      toast.success(`${intensity.charAt(0).toUpperCase() + intensity.slice(1)} haptic feedback`);
    } catch (error) {
      toast.error('Haptic feedback not available on this device');
    }
  };

  const handleReset = () => {
    resetSettings();
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Haptic Feedback Settings</h1>
          <p className="text-muted-foreground">Customize your tactile feedback experience</p>
        </div>
      </div>

      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vibrate className="h-5 w-5" />
            Master Control
          </CardTitle>
          <CardDescription>
            Enable or disable all haptic feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="master-toggle" className="text-base">
              Enable Haptic Feedback
            </Label>
            <Switch
              id="master-toggle"
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback Types */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Types</CardTitle>
          <CardDescription>
            Choose which types of interactions trigger haptic feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="interactions" className="text-base font-medium">Interactions</Label>
                <p className="text-sm text-muted-foreground">Taps, likes, shares, follows</p>
              </div>
            </div>
            <Switch
              id="interactions"
              checked={settings.enabledTypes.interactions}
              onCheckedChange={(enabled) => updateEnabledType('interactions', enabled)}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="milestones" className="text-base font-medium">Progress Milestones</Label>
                <p className="text-sm text-muted-foreground">Video playback progress (25%, 50%, 75%, 100%)</p>
              </div>
            </div>
            <Switch
              id="milestones"
              checked={settings.enabledTypes.milestones}
              onCheckedChange={(enabled) => updateEnabledType('milestones', enabled)}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <Label htmlFor="achievements" className="text-base font-medium">Achievements</Label>
                <p className="text-sm text-muted-foreground">Milestone likes, special accomplishments</p>
              </div>
            </div>
            <Switch
              id="achievements"
              checked={settings.enabledTypes.achievements}
              onCheckedChange={(enabled) => updateEnabledType('achievements', enabled)}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <Label htmlFor="errors" className="text-base font-medium">Errors & Warnings</Label>
                <p className="text-sm text-muted-foreground">Buffering, playback failures</p>
              </div>
            </div>
            <Switch
              id="errors"
              checked={settings.enabledTypes.errors}
              onCheckedChange={(enabled) => updateEnabledType('errors', enabled)}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-green-500" />
              <div>
                <Label htmlFor="navigation" className="text-base font-medium">Navigation</Label>
                <p className="text-sm text-muted-foreground">Swiping, pull-to-refresh, menu interactions</p>
              </div>
            </div>
            <Switch
              id="navigation"
              checked={settings.enabledTypes.navigation}
              onCheckedChange={(enabled) => updateEnabledType('navigation', enabled)}
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hand className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="longPress" className="text-base font-medium">Long Press</Label>
                <p className="text-sm text-muted-foreground">Progressive feedback for long-press actions</p>
              </div>
            </div>
            <Switch
              id="longPress"
              checked={settings.enabledTypes.longPress}
              onCheckedChange={(enabled) => updateEnabledType('longPress', enabled)}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intensity Control */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Intensity</CardTitle>
          <CardDescription>
            Adjust the strength of haptic feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Intensity Level</Label>
              <span className="text-sm font-medium text-primary capitalize">
                {settings.intensity}
              </span>
            </div>
            <Slider
              value={[settings.intensity === 'light' ? 0 : settings.intensity === 'medium' ? 1 : 2]}
              onValueChange={([value]) => {
                const intensity = value === 0 ? 'light' : value === 1 ? 'medium' : 'strong';
                updateSettings({ intensity });
              }}
              max={2}
              step={1}
              className="w-full"
              disabled={!settings.enabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Light</span>
              <span>Medium</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testHaptic('light')}
              disabled={!settings.enabled}
              className="flex-1"
            >
              Test Light
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testHaptic('medium')}
              disabled={!settings.enabled}
              className="flex-1"
            >
              Test Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testHaptic('strong')}
              disabled={!settings.enabled}
              className="flex-1"
            >
              Test Strong
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Long Press Duration */}
      <Card>
        <CardHeader>
          <CardTitle>Long Press Duration</CardTitle>
          <CardDescription>
            Set how long to hold before triggering long-press actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base">Duration</Label>
            <span className="text-sm font-medium text-primary">
              {settings.longPressDuration}ms
            </span>
          </div>
          <Slider
            value={[settings.longPressDuration]}
            onValueChange={([value]) => updateSettings({ longPressDuration: value })}
            min={500}
            max={2000}
            step={100}
            className="w-full"
            disabled={!settings.enabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fast (500ms)</span>
            <span>Default (1000ms)</span>
            <span>Slow (2000ms)</span>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Haptic feedback requires a device with vibration capabilities. 
                If you don't feel any vibrations, your device may not support this feature.
              </p>
              <p className="mt-2">
                Settings are saved locally and will persist across sessions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
