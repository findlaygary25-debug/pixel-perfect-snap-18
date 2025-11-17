import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Bell, Mail, MessageSquare, Users, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface NotificationStats {
  total_users: number;
  email_enabled_count: number;
  sms_enabled_count: number;
  in_app_enabled_count: number;
  flash_sales_email_count: number;
  flash_sales_in_app_count: number;
  flash_sales_sms_count: number;
  challenges_email_count: number;
  challenges_in_app_count: number;
  challenges_sms_count: number;
  follows_email_count: number;
  follows_in_app_count: number;
  follows_sms_count: number;
  comments_email_count: number;
  comments_in_app_count: number;
  comments_sms_count: number;
  shares_email_count: number;
  shares_in_app_count: number;
  shares_sms_count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export default function NotificationAnalytics() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_notification_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      toast.error('Failed to load notification analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No data available</div>
      </div>
    );
  }

  const channelData = [
    { name: 'In-App', enabled: stats.in_app_enabled_count, disabled: stats.total_users - stats.in_app_enabled_count },
    { name: 'Email', enabled: stats.email_enabled_count, disabled: stats.total_users - stats.email_enabled_count },
    { name: 'SMS', enabled: stats.sms_enabled_count, disabled: stats.total_users - stats.sms_enabled_count },
  ];

  const notificationTypeData = [
    {
      type: 'Flash Sales',
      email: stats.flash_sales_email_count,
      inApp: stats.flash_sales_in_app_count,
      sms: stats.flash_sales_sms_count,
    },
    {
      type: 'Challenges',
      email: stats.challenges_email_count,
      inApp: stats.challenges_in_app_count,
      sms: stats.challenges_sms_count,
    },
    {
      type: 'Follows',
      email: stats.follows_email_count,
      inApp: stats.follows_in_app_count,
      sms: stats.follows_sms_count,
    },
    {
      type: 'Comments',
      email: stats.comments_email_count,
      inApp: stats.comments_in_app_count,
      sms: stats.comments_sms_count,
    },
    {
      type: 'Shares',
      email: stats.shares_email_count,
      inApp: stats.shares_in_app_count,
      sms: stats.shares_sms_count,
    },
  ];

  const channelOptInRate = (count: number) => ((count / stats.total_users) * 100).toFixed(1);

  const pieChartData = [
    { name: 'In-App Enabled', value: stats.in_app_enabled_count },
    { name: 'Email Enabled', value: stats.email_enabled_count },
    { name: 'SMS Enabled', value: stats.sms_enabled_count },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground">Monitor opt-in rates and engagement metrics</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-App Opt-In</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelOptInRate(stats.in_app_enabled_count)}%</div>
            <p className="text-xs text-muted-foreground">{stats.in_app_enabled_count} users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Opt-In</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelOptInRate(stats.email_enabled_count)}%</div>
            <p className="text-xs text-muted-foreground">{stats.email_enabled_count} users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Opt-In</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channelOptInRate(stats.sms_enabled_count)}%</div>
            <p className="text-xs text-muted-foreground">{stats.sms_enabled_count} users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Channel Overview</TabsTrigger>
          <TabsTrigger value="types">Notification Types</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Opt-In vs Opt-Out</CardTitle>
              <CardDescription>Compare enabled and disabled notification channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="enabled" fill="hsl(var(--primary))" name="Enabled" />
                  <Bar dataKey="disabled" fill="hsl(var(--muted))" name="Disabled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Type Engagement</CardTitle>
              <CardDescription>Opt-in rates by notification type and channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={notificationTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="inApp" fill="hsl(var(--primary))" name="In-App" />
                  <Bar dataKey="email" fill="hsl(var(--secondary))" name="Email" />
                  <Bar dataKey="sms" fill="hsl(var(--accent))" name="SMS" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Notification Type Details */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Flash Sales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{channelOptInRate(stats.flash_sales_email_count)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In-App:</span>
                  <span className="font-medium">{channelOptInRate(stats.flash_sales_in_app_count)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{channelOptInRate(stats.challenges_email_count)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In-App:</span>
                  <span className="font-medium">{channelOptInRate(stats.challenges_in_app_count)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Follows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{channelOptInRate(stats.follows_email_count)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In-App:</span>
                  <span className="font-medium">{channelOptInRate(stats.follows_in_app_count)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{channelOptInRate(stats.comments_email_count)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In-App:</span>
                  <span className="font-medium">{channelOptInRate(stats.comments_in_app_count)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Shares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{channelOptInRate(stats.shares_email_count)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In-App:</span>
                  <span className="font-medium">{channelOptInRate(stats.shares_in_app_count)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Distribution</CardTitle>
              <CardDescription>Overall enabled notification channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
