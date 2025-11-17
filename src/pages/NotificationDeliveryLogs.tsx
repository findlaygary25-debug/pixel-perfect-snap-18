import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileDown, 
  Mail, 
  MessageSquare, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  Search,
  Eye,
  Copy,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient_id: string;
  recipient_identifier: string;
  channel: 'email' | 'sms' | 'in_app';
  status: 'sent' | 'failed' | 'pending';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  error_message: string | null;
  external_id: string | null;
  metadata: Record<string, any>;
  sent_at: string;
  created_at: string;
}

interface Statistics {
  total: number;
  sent: number;
  failed: number;
  emailsSent: number;
  emailsFailed: number;
  smsSent: number;
  smsFailed: number;
  todayCount: number;
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  pending_orders: "Pending Orders",
  new_users: "New Users",
  ending_sales: "Ending Sales",
  system_errors: "System Errors",
  high_value_orders: "High Value Orders"
};

export default function NotificationDeliveryLogs() {
  const { isAdmin, loading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    sent: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    smsSent: 0,
    smsFailed: 0,
    todayCount: 0
  });
  
  // Filters
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detail drawer
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
      setupRealtime();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [logs, channelFilter, statusFilter, typeFilter, priorityFilter, searchQuery]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setLogs((data || []) as NotificationLog[]);
      calculateStatistics((data || []) as NotificationLog[]);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('notification-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_delivery_logs'
        },
        (payload) => {
          const newLog = payload.new as NotificationLog;
          setLogs(prev => [newLog, ...prev]);
          toast.success('New notification log received', {
            description: `${newLog.channel.toUpperCase()}: ${newLog.title}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateStatistics = (data: NotificationLog[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats: Statistics = {
      total: data.length,
      sent: data.filter(l => l.status === 'sent').length,
      failed: data.filter(l => l.status === 'failed').length,
      emailsSent: data.filter(l => l.channel === 'email' && l.status === 'sent').length,
      emailsFailed: data.filter(l => l.channel === 'email' && l.status === 'failed').length,
      smsSent: data.filter(l => l.channel === 'sms' && l.status === 'sent').length,
      smsFailed: data.filter(l => l.channel === 'sms' && l.status === 'failed').length,
      todayCount: data.filter(l => new Date(l.sent_at) >= today).length
    };
    
    setStatistics(stats);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (channelFilter !== "all") {
      filtered = filtered.filter(l => l.channel === channelFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(l => l.notification_type === typeFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(l => l.priority === priorityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.recipient_identifier.toLowerCase().includes(query) ||
        l.title.toLowerCase().includes(query) ||
        l.message.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Type', 'Channel', 'Status', 'Priority', 'Recipient', 'Title', 'Message', 'External ID', 'Error'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm:ss'),
      NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type,
      log.channel,
      log.status,
      log.priority,
      log.recipient_identifier,
      log.title,
      log.message,
      log.external_id || '',
      log.error_message || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Logs exported successfully');
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">{priority}</Badge>;
      case 'medium':
        return <Badge variant="secondary">{priority}</Badge>;
      case 'low':
        return <Badge variant="outline">{priority}</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const viewDetails = (log: NotificationLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const successRate = statistics.total > 0 
    ? ((statistics.sent / statistics.total) * 100).toFixed(1)
    : '0.0';

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (authLoading || !isAdmin) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Delivery Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track and monitor all notification deliveries for compliance and debugging
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={filteredLogs.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.todayCount} sent today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.sent} delivered successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.emailsSent}
              <span className="text-sm text-muted-foreground font-normal ml-2">
                / {statistics.emailsSent + statistics.emailsFailed}
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {statistics.emailsFailed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SMS Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.smsSent}
              <span className="text-sm text-muted-foreground font-normal ml-2">
                / {statistics.smsSent + statistics.smsFailed}
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              {statistics.smsFailed} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {(channelFilter !== "all" || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setChannelFilter("all");
                setStatusFilter("all");
                setTypeFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivery Logs ({filteredLogs.length})</CardTitle>
            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : currentLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No logs found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewDetails(log)}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.sent_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.recipient_identifier}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getChannelIcon(log.channel)}
                            <span className="text-xs capitalize">{log.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{getPriorityBadge(log.priority)}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.title}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewDetails(log);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader>
                <SheetTitle>Notification Details</SheetTitle>
                <SheetDescription>
                  Complete information about this notification delivery
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status & Channel */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(selectedLog.channel)}
                    <span className="font-medium capitalize">{selectedLog.channel}</span>
                  </div>
                  {getStatusBadge(selectedLog.status)}
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="font-medium">
                      {NOTIFICATION_TYPE_LABELS[selectedLog.notification_type] || selectedLog.notification_type}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedLog.priority)}</div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Recipient</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{selectedLog.recipient_identifier}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedLog.recipient_identifier)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Sent At</Label>
                    <p className="font-mono text-sm">
                      {format(new Date(selectedLog.sent_at), 'PPpp')}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <p className="font-medium">{selectedLog.title}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Message</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedLog.message}
                    </p>
                  </div>
                </div>

                {/* External ID */}
                {selectedLog.external_id && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">External ID</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{selectedLog.external_id}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedLog.external_id!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedLog.channel === 'email' ? 'Resend Message ID' : 'Twilio Message SID'}
                      </p>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {selectedLog.error_message && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Error Message
                      </Label>
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                        <p className="text-sm text-red-900 dark:text-red-200 whitespace-pre-wrap">
                          {selectedLog.error_message}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Additional Data</Label>
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}