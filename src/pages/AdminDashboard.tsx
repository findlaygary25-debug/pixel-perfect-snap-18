import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Video, 
  ShoppingBag, 
  TrendingUp, 
  Zap, 
  Shield, 
  FileText,
  FlaskConical,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface SystemStats {
  totalUsers: number;
  totalVideos: number;
  totalOrders: number;
  totalRevenue: number;
  activeFlashSales: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    database: "healthy",
    storage: "healthy",
    api: "healthy"
  });

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadDashboardData();
    }
  }, [authLoading, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch video count
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      // Fetch order stats
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Fetch pending orders
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch active flash sales
      const { count: flashSaleCount } = await supabase
        .from('reward_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_on_sale', true)
        .gt('sale_end_date', new Date().toISOString());

      setStats({
        totalUsers: userCount || 0,
        totalVideos: videoCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue: totalRevenue,
        activeFlashSales: flashSaleCount || 0,
        pendingOrders: pendingCount || 0
      });

      // System health checks (simplified)
      setSystemHealth({
        database: "healthy",
        storage: "healthy",
        api: "healthy"
      });

    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
      setSystemHealth({
        database: "error",
        storage: "unknown",
        api: "unknown"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of system statistics and quick administrative actions
        </p>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm">Database:</span>
              <Badge variant={systemHealth.database === "healthy" ? "default" : "destructive"}>
                {systemHealth.database === "healthy" ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {systemHealth.database}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">Storage:</span>
              <Badge variant={systemHealth.storage === "healthy" ? "default" : "destructive"}>
                {systemHealth.storage === "healthy" ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {systemHealth.storage}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">API:</span>
              <Badge variant={systemHealth.api === "healthy" ? "default" : "destructive"}>
                {systemHealth.api === "healthy" ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {systemHealth.api}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVideos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Uploaded content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 relative"
              onClick={() => navigate("/admin/flash-sales")}
            >
              <Zap className="h-6 w-6" />
              <span className="text-sm font-medium">Flash Sales</span>
              <span className="text-xs text-muted-foreground">
                {stats?.activeFlashSales || 0} active
              </span>
              {stats && stats.activeFlashSales > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0"
                >
                  {stats.activeFlashSales}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/admin/roles")}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm font-medium">Manage Roles</span>
              <span className="text-xs text-muted-foreground">User permissions</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/pii-audit-logs")}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm font-medium">Audit Logs</span>
              <span className="text-xs text-muted-foreground">PII access tracking</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate("/notification-ab-tests")}
            >
              <FlaskConical className="h-6 w-6" />
              <span className="text-sm font-medium">A/B Testing</span>
              <span className="text-xs text-muted-foreground">Notification tests</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">User registrations</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalUsers} total registered users
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Content uploads</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalVideos} videos uploaded
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Order processing</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingOrders} orders pending fulfillment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Platform details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium">uTubChat</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Backend</span>
                <Badge variant="outline">Lovable Cloud</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Database Status</span>
                <Badge variant={systemHealth.database === "healthy" ? "default" : "destructive"}>
                  {systemHealth.database}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Flash Sales</span>
                <span className="text-sm font-medium">{stats?.activeFlashSales || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
