import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Eye, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AuditLog = {
  id: string;
  table_name: string;
  row_id: string;
  action: string;
  accessed_columns: string[];
  accessed_at: string;
};

export default function PIIAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pii_audit_logs")
        .select("*")
        .order("accessed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "SELECT":
        return <Eye className="h-4 w-4" />;
      case "INSERT":
        return <Plus className="h-4 w-4" />;
      case "UPDATE":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionVariant = (action: string): "default" | "secondary" | "destructive" => {
    switch (action) {
      case "SELECT":
        return "default";
      case "INSERT":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              PII Audit Logs
            </h1>
            <p className="text-muted-foreground mt-2">
              Track all access to personally identifiable information (PII) in your orders
            </p>
          </div>
          <Button onClick={fetchAuditLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent PII Access History</CardTitle>
            <CardDescription>
              All access to customer emails, phone numbers, and shipping addresses is logged here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Accessed Fields</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No audit logs found. PII access will be tracked here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={getActionVariant(log.action)} className="flex items-center gap-1 w-fit">
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.row_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {log.accessed_columns.map((col) => (
                              <Badge key={col} variant="outline" className="text-xs">
                                {col}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.accessed_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Features Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Field-Level Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Customer emails, phone numbers, and addresses are encrypted at rest using AES-256
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Eye className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Access Logging</h3>
                  <p className="text-sm text-muted-foreground">
                    Every PII access is logged with timestamp and accessed fields for compliance
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
