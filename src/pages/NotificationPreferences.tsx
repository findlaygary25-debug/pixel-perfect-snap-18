import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, MessageSquare, Bell, Loader2, Zap, Trophy, Users, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  flash_sales_email: boolean;
  flash_sales_sms: boolean;
  flash_sales_in_app: boolean;
  challenges_email: boolean;
  challenges_sms: boolean;
  challenges_in_app: boolean;
  follows_email: boolean;
  follows_sms: boolean;
  follows_in_app: boolean;
  comments_email: boolean;
  comments_sms: boolean;
  comments_in_app: boolean;
  shares_email: boolean;
  shares_sms: boolean;
  shares_in_app: boolean;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: insertError } = await supabase
            .from('user_notification_preferences')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setPreferences(newPrefs);
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error("Failed to load preferences", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, [field]: value };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .update({ [field]: value })
        .eq('id', preferences.id);

      if (error) throw error;

      toast.success("Preferences updated");
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error("Failed to update preferences", {
        description: error.message,
      });
      // Revert on error
      setPreferences(preferences);
    }
  };

  const saveAllPreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(preferences)
        .eq('id', preferences.id);

      if (error) throw error;

      toast.success("All preferences saved successfully");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Unable to Load Preferences</CardTitle>
            <CardDescription>Please try refreshing the page or logging in again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const notificationTypes = [
    {
      id: 'flash_sales',
      name: 'Flash Sales',
      description: 'Get notified about limited-time flash sales and special offers',
      icon: Zap,
      color: 'text-orange-500',
    },
    {
      id: 'challenges',
      name: 'Weekly Challenges',
      description: 'Updates about new challenges and completed milestones',
      icon: Trophy,
      color: 'text-yellow-500',
    },
    {
      id: 'follows',
      name: 'New Followers',
      description: 'When someone starts following you',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      id: 'comments',
      name: 'Comments',
      description: 'When someone comments on your videos',
      icon: MessageCircle,
      color: 'text-green-500',
    },
    {
      id: 'shares',
      name: 'Shares',
      description: 'When someone shares your videos',
      icon: Share2,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Choose how you want to receive notifications for different activities
        </p>
      </div>

      {/* Global Channel Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Global Channel Settings
          </CardTitle>
          <CardDescription>
            Enable or disable entire notification channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="in-app-global" className="font-medium">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">Show notifications within the app</p>
              </div>
            </div>
            <Switch
              id="in-app-global"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) => updatePreference('in_app_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="email-global" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email-global"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="sms-global" className="font-medium">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Get text message alerts (coming soon)</p>
              </div>
            </div>
            <Switch
              id="sms-global"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Notification Type Settings */}
      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <type.icon className={`h-5 w-5 ${type.color}`} />
                {type.name}
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <Label>In-App</Label>
                  </div>
                  <Switch
                    checked={preferences[`${type.id}_in_app` as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      updatePreference(`${type.id}_in_app` as keyof NotificationPreferences, checked)
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label>Email</Label>
                  </div>
                  <Switch
                    checked={preferences[`${type.id}_email` as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      updatePreference(`${type.id}_email` as keyof NotificationPreferences, checked)
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Label>SMS</Label>
                  </div>
                  <Switch
                    checked={preferences[`${type.id}_sms` as keyof NotificationPreferences] as boolean}
                    onCheckedChange={(checked) =>
                      updatePreference(`${type.id}_sms` as keyof NotificationPreferences, checked)
                    }
                    disabled={!preferences.sms_enabled || true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={saveAllPreferences} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save All Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
