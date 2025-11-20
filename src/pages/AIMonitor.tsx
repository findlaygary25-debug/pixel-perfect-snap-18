import { useState, useEffect } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bot, RefreshCw, AlertTriangle, CheckCircle2, Shield, Database } from "lucide-react";
import { format } from "date-fns";

interface AILog {
  id: string;
  action_type: string;
  target_table: string;
  target_id: string;
  issue_detected: string | null;
  action_taken: string;
  severity: string;
  auto_fixed: boolean;
  created_at: string;
  metadata: any;
}

export default function AIMonitor() {
  useAdminCheck();
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_monitor_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load AI monitor logs",
        variant: "destructive",
      });
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  const runDataScan = async () => {
    setScanning(true);
    toast({
      title: "Starting scan",
      description: "AI is scanning for data integrity issues...",
    });

    const { data, error } = await supabase.functions.invoke('ai-data-integrity-scan');

    if (error) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Scan complete",
        description: `Found ${data.totalIssues} issues, fixed ${data.fixedCount} automatically`,
      });
      fetchLogs();
    }
    setScanning(false);
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive"
    };
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>;
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'content_moderation') return <Shield className="h-4 w-4" />;
    if (actionType === 'data_fix') return <Database className="h-4 w-4" />;
    return <Bot className="h-4 w-4" />;
  };

  const stats = {
    total: logs.length,
    autoFixed: logs.filter(l => l.auto_fixed).length,
    contentMod: logs.filter(l => l.action_type === 'content_moderation').length,
    dataFixes: logs.filter(l => l.action_type === 'data_fix').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Monitor
          </h1>
          <p className="text-muted-foreground">
            Automated content moderation and data integrity monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runDataScan} disabled={scanning}>
            <Database className="h-4 w-4 mr-2" />
            {scanning ? "Scanning..." : "Run Data Scan"}
          </Button>
          <Button onClick={fetchLogs} variant="outline" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auto-Fixed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoFixed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Content Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contentMod}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dataFixes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Activity Log</CardTitle>
          <CardDescription>Recent automated actions and fixes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No AI activity yet. Run a data scan to start monitoring.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action_type)}
                          <span className="capitalize">{log.action_type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.target_table}</div>
                          <div className="text-muted-foreground text-xs">{log.target_id?.substring(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {log.issue_detected || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {log.action_taken}
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell>
                        {log.auto_fixed ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Auto-fixed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Manual review
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Auto Content Moderation</div>
              <div className="text-sm text-muted-foreground">
                AI automatically scans and flags inappropriate comments using Gemini 2.5 Flash
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Database className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Data Integrity Scanning</div>
              <div className="text-sm text-muted-foreground">
                Periodic scans check for missing data, broken references, and automatically fix common issues
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Bot className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Smart Automation</div>
              <div className="text-sm text-muted-foreground">
                Safe fixes are applied automatically, critical issues are flagged for manual review
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
