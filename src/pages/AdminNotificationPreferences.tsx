import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Mail, MessageSquare, Save } from "lucide-react";
import { toast } from "sonner";

interface Preferences {
  id?: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  
  pending_orders_in_app: boolean;
  new_users_in_app: boolean;
  ending_sales_in_app: boolean;
  system_errors_in_app: boolean;
  high_value_orders_in_app: boolean;
  
  pending_orders_email: boolean;
  new_users_email: boolean;
  ending_sales_email: boolean;
  system_errors_email: boolean;
  high_value_orders_email: boolean;
  
  pending_orders_sms: boolean;
  new_users_sms: boolean;
  ending_sales_sms: boolean;
  system_errors_sms: boolean;
  high_value_orders_sms: boolean;
  
  high_value_order_threshold: number;
  notification_email: string;
  notification_phone: string;
}

const defaultPreferences: Preferences = {
  in_app_enabled: true,
  email_enabled: true,
  sms_enabled: false,
  
  pending_orders_in_app: true,
  new_users_in_app: true,
  ending_sales_in_app: true,
  system_errors_in_app: true,
  high_value_orders_in_app: true,
  
  pending_orders_email: true,
  new_users_email: false,
  ending_sales_email: true,
  system_errors_email: true,
  high_value_orders_email: true,
  
  pending_orders_sms: false,
  new_users_sms: false,
  ending_sales_sms: false,
  system_errors_sms: true,
  high_value_orders_sms: true,
  
  high_value_order_threshold: 1000,
  notification_email: "",
  notification_phone: ""
};

export default function AdminNotificationPreferences() {
  const { isAdmin, loading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadPreferences();
    }
  }, [authLoading, isAdmin]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data as Preferences);
      } else {
        // Get user email for default notification email
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        const userEmail = user.email || "";
        setPreferences({ ...defaultPreferences, notification_email: userEmail });
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('admin_notification_preferences')
        .upsert({
          ...preferences,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Preferences saved successfully");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize how and when you receive administrative alerts
        </p>
      </div>

      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Enable or disable notification channels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in-app">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the admin notification center
                </p>
              </div>
            </div>
            <Switch
              id="in-app"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, in_app_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to your email address
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email_enabled: checked })
              }
            />
          </div>

          {preferences.email_enabled && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="notification-email">Notification Email</Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="admin@example.com"
                value={preferences.notification_email}
                onChange={(e) =>
                  setPreferences({ ...preferences, notification_email: e.target.value })
                }
              />
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send critical alerts via SMS (requires Twilio setup)
                </p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, sms_enabled: checked })
              }
            />
          </div>

          {preferences.sms_enabled && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="notification-phone">Phone Number</Label>
              <Input
                id="notification-phone"
                type="tel"
                placeholder="+1234567890"
                value={preferences.notification_phone}
                onChange={(e) =>
                  setPreferences({ ...preferences, notification_phone: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Type Preferences</CardTitle>
          <CardDescription>Choose which alerts to receive for each channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pending Orders */}
            <div className="space-y-3">
              <h3 className="font-medium">Pending Orders</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="pending-orders-in-app" className="text-sm">In-App</Label>
                  <Switch
                    id="pending-orders-in-app"
                    checked={preferences.pending_orders_in_app}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pending_orders_in_app: checked })
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="pending-orders-email" className="text-sm">Email</Label>
                  <Switch
                    id="pending-orders-email"
                    checked={preferences.pending_orders_email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pending_orders_email: checked })
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="pending-orders-sms" className="text-sm">SMS</Label>
                  <Switch
                    id="pending-orders-sms"
                    checked={preferences.pending_orders_sms}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, pending_orders_sms: checked })
                    }
                    disabled={!preferences.sms_enabled}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* New Users */}
            <div className="space-y-3">
              <h3 className="font-medium">New User Registrations</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="new-users-in-app" className="text-sm">In-App</Label>
                  <Switch
                    id="new-users-in-app"
                    checked={preferences.new_users_in_app}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, new_users_in_app: checked })
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="new-users-email" className="text-sm">Email</Label>
                  <Switch
                    id="new-users-email"
                    checked={preferences.new_users_email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, new_users_email: checked })
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="new-users-sms" className="text-sm">SMS</Label>
                  <Switch
                    id="new-users-sms"
                    checked={preferences.new_users_sms}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, new_users_sms: checked })
                    }
                    disabled={!preferences.sms_enabled}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Ending Sales */}
            <div className="space-y-3">
              <h3 className="font-medium">Flash Sales Ending Soon</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="ending-sales-in-app" className="text-sm">In-App</Label>
                  <Switch
                    id="ending-sales-in-app"
                    checked={preferences.ending_sales_in_app}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, ending_sales_in_app: checked })
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="ending-sales-email" className="text-sm">Email</Label>
                  <Switch
                    id="ending-sales-email"
                    checked={preferences.ending_sales_email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, ending_sales_email: checked })
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="ending-sales-sms" className="text-sm">SMS</Label>
                  <Switch
                    id="ending-sales-sms"
                    checked={preferences.ending_sales_sms}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, ending_sales_sms: checked })
                    }
                    disabled={!preferences.sms_enabled}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* System Errors */}
            <div className="space-y-3">
              <h3 className="font-medium">System Errors</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="system-errors-in-app" className="text-sm">In-App</Label>
                  <Switch
                    id="system-errors-in-app"
                    checked={preferences.system_errors_in_app}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, system_errors_in_app: checked })
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="system-errors-email" className="text-sm">Email</Label>
                  <Switch
                    id="system-errors-email"
                    checked={preferences.system_errors_email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, system_errors_email: checked })
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="system-errors-sms" className="text-sm">SMS</Label>
                  <Switch
                    id="system-errors-sms"
                    checked={preferences.system_errors_sms}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, system_errors_sms: checked })
                    }
                    disabled={!preferences.sms_enabled}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* High Value Orders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">High Value Orders</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="high-value-threshold" className="text-sm">
                    Threshold: $
                  </Label>
                  <Input
                    id="high-value-threshold"
                    type="number"
                    min="0"
                    step="100"
                    className="w-32"
                    value={preferences.high_value_order_threshold}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        high_value_order_threshold: Number(e.target.value)
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="high-value-orders-in-app" className="text-sm">In-App</Label>
                  <Switch
                    id="high-value-orders-in-app"
                    checked={preferences.high_value_orders_in_app}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, high_value_orders_in_app: checked })
                    }
                    disabled={!preferences.in_app_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="high-value-orders-email" className="text-sm">Email</Label>
                  <Switch
                    id="high-value-orders-email"
                    checked={preferences.high_value_orders_email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, high_value_orders_email: checked })
                    }
                    disabled={!preferences.email_enabled}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="high-value-orders-sms" className="text-sm">SMS</Label>
                  <Switch
                    id="high-value-orders-sms"
                    checked={preferences.high_value_orders_sms}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, high_value_orders_sms: checked })
                    }
                    disabled={!preferences.sms_enabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
