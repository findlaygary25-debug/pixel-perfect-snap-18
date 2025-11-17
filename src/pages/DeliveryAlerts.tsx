import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Clock,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DeliveryAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_value: number | null;
  threshold_value: number | null;
  affected_period_start: string;
  affected_period_end: string;
  metadata: any;
  alert_sent: boolean;
  alert_sent_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export default function DeliveryAlerts() {
  const { isAdmin, loading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  
  const [alerts, setAlerts] = useState<DeliveryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [runningManualCheck, setRunningManualCheck] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadAlerts();
      setupRealtime();
    }
  }, [isAdmin]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setAlerts((data || []) as DeliveryAlert[]);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load delivery alerts');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('delivery-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_alerts'
        },
        (payload) => {
          console.log('Alert update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as DeliveryAlert;
            setAlerts(prev => [newAlert, ...prev]);
            
            // Show toast notification for new alerts
            const severityIcon = newAlert.severity === 'critical' ? '🚨' : 
                                newAlert.severity === 'high' ? '⚠️' : 'ℹ️';
            toast.error(`${severityIcon} ${newAlert.title}`, {
              description: newAlert.description.substring(0, 150) + '...',
              duration: 10000,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = payload.new as DeliveryAlert;
            setAlerts(prev => prev.map(alert => 
              alert.id === updatedAlert.id ? updatedAlert : alert
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const runManualCheck = async () => {
    try {
      setRunningManualCheck(true);
      toast.info('Running SMS delivery check...');

      const { data, error } = await supabase.functions.invoke('monitor-sms-delivery', {
        body: { manual: true }
      });

      if (error) throw error;

      console.log('Manual check result:', data);
      
      if (data.alerts_triggered === 0) {
        toast.success('✅ All systems healthy', {
          description: `Checked ${data.metrics?.totalSMS || 0} SMS messages. No issues detected.`
        });
      } else {
        toast.warning(`⚠️ ${data.alerts_triggered} alert(s) detected`, {
          description: 'Check the alerts below for details.'
        });
      }

      await loadAlerts();
    } catch (error: any) {
      console.error('Error running manual check:', error);
      toast.error('Failed to run delivery check');
    } finally {
      setRunningManualCheck(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ));

      toast.success('Alert marked as resolved');
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />Critical
        </Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />High
        </Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />Medium
        </Badge>;
      case 'low':
        return <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />Low
        </Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'low_delivery_rate':
        return 'Low Delivery Rate';
      case 'high_failure_rate':
        return 'High Failure Rate';
      case 'sudden_drop':
        return 'Sudden Drop';
      case 'error_pattern':
        return 'Error Pattern';
      default:
        return type;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'low_delivery_rate':
        return <TrendingDown className="h-4 w-4" />;
      case 'high_failure_rate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'sudden_drop':
        return <TrendingDown className="h-4 w-4" />;
      case 'error_pattern':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Delivery Alerts</h1>
          <p className="text-muted-foreground">
            Automated monitoring and alerts for SMS delivery issues
          </p>
        </div>
        <Button 
          onClick={runManualCheck} 
          disabled={runningManualCheck}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${runningManualCheck ? 'animate-spin' : ''}`} />
          {runningManualCheck ? 'Checking...' : 'Run Check Now'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resolvedAlerts.filter(a => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return a.resolved_at && new Date(a.resolved_at) >= today;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {resolvedAlerts.length} total resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Check</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{15 - (new Date().getMinutes() % 15)} min</div>
            <p className="text-xs text-muted-foreground">
              Runs every 15 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Systems Healthy</h3>
                <p className="text-muted-foreground">
                  No active alerts. SMS delivery is operating normally.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <Card key={alert.id} className={alert.severity === 'critical' ? 'border-destructive' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.alert_type)}
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(alert.severity)}
                            <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{alert.description}</p>
                      
                      {(alert.metric_value !== null || alert.threshold_value !== null) && (
                        <div className="flex gap-4 text-sm">
                          {alert.metric_value !== null && (
                            <div>
                              <span className="text-muted-foreground">Metric: </span>
                              <span className="font-medium">{alert.metric_value.toFixed(1)}%</span>
                            </div>
                          )}
                          {alert.threshold_value !== null && (
                            <div>
                              <span className="text-muted-foreground">Threshold: </span>
                              <span className="font-medium">{alert.threshold_value.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Detected:</span>
                          <span>{format(new Date(alert.created_at), 'PPp')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Affected Period:</span>
                          <span>
                            {format(new Date(alert.affected_period_start), 'HH:mm')} - {format(new Date(alert.affected_period_end), 'HH:mm')}
                          </span>
                        </div>
                        {alert.alert_sent && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Notification Sent:</span>
                            <span className="text-green-500">✓ {alert.alert_sent_at && format(new Date(alert.alert_sent_at), 'PPp')}</span>
                          </div>
                        )}
                      </div>

                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <>
                          <Separator />
                          <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          </details>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Alerts</h3>
                <p className="text-muted-foreground">
                  Resolved alerts will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {resolvedAlerts.map((alert) => (
                  <Card key={alert.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.alert_type)}
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(alert.severity)}
                            <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                            <Badge className="bg-green-500/10 text-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{alert.description}</p>
                      
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Detected:</span>
                          <span>{format(new Date(alert.created_at), 'PPp')}</span>
                        </div>
                        {alert.resolved_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Resolved:</span>
                            <span className="text-green-500">{format(new Date(alert.resolved_at), 'PPp')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
