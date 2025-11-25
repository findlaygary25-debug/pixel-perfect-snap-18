import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings, Upload } from "lucide-react";

interface UploadSettings {
  maxFileSizeMB: number;
  maxDurationSeconds: number;
  allowedTypes: string[];
}

export default function AdminUploadSettings() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UploadSettings>({
    maxFileSizeMB: 100,
    maxDurationSeconds: 300,
    allowedTypes: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]
  });

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('setting_key', ['upload_max_file_size_mb', 'upload_max_video_duration_seconds', 'upload_allowed_video_types']);

      if (error) throw error;

      if (data) {
        const maxSize = data.find(s => s.setting_key === 'upload_max_file_size_mb');
        const maxDuration = data.find(s => s.setting_key === 'upload_max_video_duration_seconds');
        const allowedTypes = data.find(s => s.setting_key === 'upload_allowed_video_types');

        setSettings({
          maxFileSizeMB: maxSize ? Number(maxSize.setting_value) : 100,
          maxDurationSeconds: maxDuration ? Number(maxDuration.setting_value) : 300,
          allowedTypes: allowedTypes ? JSON.parse(allowedTypes.setting_value as string) : []
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates = [
        {
          setting_key: 'upload_max_file_size_mb',
          setting_value: settings.maxFileSizeMB.toString(),
          updated_by: user.id
        },
        {
          setting_key: 'upload_max_video_duration_seconds',
          setting_value: settings.maxDurationSeconds.toString(),
          updated_by: user.id
        },
        {
          setting_key: 'upload_allowed_video_types',
          setting_value: JSON.stringify(settings.allowedTypes),
          updated_by: user.id
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({
            setting_value: update.setting_value,
            updated_by: update.updated_by,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', update.setting_key);

        if (error) throw error;
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Upload Settings</h1>
          <p className="text-muted-foreground">Configure upload limits and restrictions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Video Upload Configuration
          </CardTitle>
          <CardDescription>
            Manage file size limits, duration restrictions, and allowed file types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
            <Input
              id="maxFileSize"
              type="number"
              min="1"
              max="500"
              value={settings.maxFileSizeMB}
              onChange={(e) => setSettings({ ...settings, maxFileSizeMB: Number(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum allowed file size for video uploads
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxDuration">Maximum Video Duration (seconds)</Label>
            <Input
              id="maxDuration"
              type="number"
              min="30"
              max="3600"
              value={settings.maxDurationSeconds}
              onChange={(e) => setSettings({ ...settings, maxDurationSeconds: Number(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Maximum allowed duration for uploaded videos ({Math.floor(settings.maxDurationSeconds / 60)} minutes)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Allowed Video Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {settings.allowedTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Currently supported MIME types for video uploads
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}