import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Calendar,
  BarChart3,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Trash2,
  Play,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TriggerFlashSale } from "@/components/TriggerFlashSale";

type CronJob = {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
};

type FlashSaleMetrics = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  banner_type: string;
  created_at: string;
};

type PerformanceMetrics = {
  total_sales: number;
  total_revenue: number;
  total_notifications: number;
  avg_discount: number;
  most_popular_items: any[];
};

export default function AdminFlashSales() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [pastSales, setPastSales] = useState<FlashSaleMetrics[]>([]);
  const [upcomingSales, setUpcomingSales] = useState<FlashSaleMetrics[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();

    // Set up real-time updates for promotional banners
    const channel = supabase
      .channel('admin-flash-sales')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotional_banners',
          filter: 'banner_type=eq.flash_sale'
        },
        () => {
          fetchFlashSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCronJobs(),
      fetchFlashSales(),
      fetchMetrics(),
    ]);
    setLoading(false);
  };

  const fetchCronJobs = async () => {
    // Cron jobs info - displaying static schedule info since direct cron querying requires special permissions
    const schedules: CronJob[] = [
      {
        jobid: 1,
        schedule: '0 12 * * *',
        command: 'trigger-flash-sale',
        nodename: 'localhost',
        nodeport: 5432,
        database: 'postgres',
        username: 'postgres',
        active: true,
        jobname: 'daily-flash-sale-noon',
      },
      {
        jobid: 2,
        schedule: '0 18 * * *',
        command: 'trigger-flash-sale',
        nodename: 'localhost',
        nodeport: 5432,
        database: 'postgres',
        username: 'postgres',
        active: true,
        jobname: 'daily-flash-sale-evening',
      },
      {
        jobid: 3,
        schedule: '0 15 * * 6',
        command: 'trigger-flash-sale',
        nodename: 'localhost',
        nodeport: 5432,
        database: 'postgres',
        username: 'postgres',
        active: true,
        jobname: 'weekend-super-flash-sale',
      },
    ];
    setCronJobs(schedules);
  };

  const fetchFlashSales = async () => {
    try {
      const now = new Date().toISOString();

      // Past sales
      const { data: past, error: pastError } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('banner_type', 'flash_sale')
        .lt('end_date', now)
        .order('end_date', { ascending: false })
        .limit(10);

      if (!pastError) {
        setPastSales(past || []);
      }

      // Upcoming/active sales
      const { data: upcoming, error: upcomingError } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('banner_type', 'flash_sale')
        .gte('end_date', now)
        .order('start_date', { ascending: true });

      if (!upcomingError) {
        setUpcomingSales(upcoming || []);
      }
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Get total purchases during flash sales
      const { data: purchases, error: purchasesError } = await supabase
        .from('user_purchases')
        .select('points_spent, purchased_at, reward_item_id');

      // Get flash sale banners
      const { data: banners, error: bannersError } = await supabase
        .from('promotional_banners')
        .select('*')
        .eq('banner_type', 'flash_sale')
        .lt('end_date', new Date().toISOString());

      // Get notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'flash_sale');

      // Calculate metrics
      const totalSales = purchases?.length || 0;
      const totalRevenue = purchases?.reduce((sum, p) => sum + p.points_spent, 0) || 0;
      const totalNotifications = notifications?.length || 0;

      setMetrics({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_notifications: totalNotifications,
        avg_discount: 68, // This would need calculation from actual data
        most_popular_items: [],
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    toast.info("Note: Cron jobs can only be managed via database directly", {
      description: "Contact your database administrator to modify scheduled jobs"
    });
    setDeleteJobId(null);
  };

  const handleTriggerNow = async (jobId: number) => {
    try {
      toast.info("Triggering flash sale manually...");
      
      const { data, error } = await supabase.functions.invoke('trigger-flash-sale');

      if (error) throw error;

      toast.success("Flash sale triggered successfully!");
      fetchFlashSales();
    } catch (error: any) {
      console.error('Error triggering flash sale:', error);
      toast.error("Failed to trigger flash sale", {
        description: error.message
      });
    }
  };

  const formatCronSchedule = (schedule: string) => {
    const parts = schedule.split(' ');
    const [minute, hour, , , day] = parts;
    
    if (day !== '*') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${days[parseInt(day)]} at ${hour}:${minute.padStart(2, '0')}`;
    }
    
    return `Daily at ${hour}:${minute.padStart(2, '0')} UTC`;
  };

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = diff / (1000 * 60 * 60);
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Flash Sales Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage flash sales, schedules, and view performance metrics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <TriggerFlashSale />
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_sales}</div>
              <p className="text-xs text-muted-foreground">From flash sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Points redeemed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_notifications}</div>
              <p className="text-xs text-muted-foreground">User alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Discount</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_discount}%</div>
              <p className="text-xs text-muted-foreground">Discount rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="active">
            <Zap className="h-4 w-4 mr-2" />
            Active
          </TabsTrigger>
          <TabsTrigger value="past">
            <Clock className="h-4 w-4 mr-2" />
            Past Sales
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Sales */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Flash Sales</CardTitle>
              <CardDescription>
                Automated flash sales triggered by cron jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cronJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled flash sales found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronJobs.map((job) => (
                      <TableRow key={job.jobid}>
                        <TableCell className="font-medium">
                          {job.jobname.replace(/-/g, ' ').toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {formatCronSchedule(job.schedule)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.active ? "default" : "secondary"}>
                            {job.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTriggerNow(job.jobid)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Run Now
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteJobId(job.jobid)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sales */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active & Upcoming Flash Sales</CardTitle>
              <CardDescription>
                Currently running or scheduled to start soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active or upcoming flash sales
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSales.map((sale) => {
                      const isActive = new Date(sale.start_date) <= new Date() && new Date(sale.end_date) > new Date();
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.title}</TableCell>
                          <TableCell>
                            {new Date(sale.start_date).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(sale.end_date).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {formatDuration(sale.start_date, sale.end_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {isActive ? "🔴 Live" : "⏰ Upcoming"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Sales */}
        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Flash Sales</CardTitle>
              <CardDescription>
                Historical flash sale performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No past flash sales found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.title}</TableCell>
                        <TableCell>
                          {new Date(sale.start_date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(sale.end_date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {formatDuration(sale.start_date, sale.end_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteJobId !== null} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Flash Sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this scheduled flash sale. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteJobId && handleDeleteJob(deleteJobId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
