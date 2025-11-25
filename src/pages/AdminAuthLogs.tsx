import { useEffect, useState } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AuthLog {
  id: string;
  timestamp: string;
  level: string;
  msg: string;
  path: string | null;
  status: string | null;
}

export default function AdminAuthLogs() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadAuthLogs();
    }
  }, [isAdmin, adminLoading]);

  const loadAuthLogs = async () => {
    setLoading(true);
    try {
      // Simulated auth logs - in production, these would come from Supabase analytics
      // The actual auth logs are visible in the "useful-context" section for admins
      const simulatedLogs: AuthLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          msg: 'User login successful',
          path: '/token',
          status: '200'
        }
      ];
      
      setLogs(simulatedLogs);
      toast({
        title: "Auth logs loaded",
        description: "Viewing simulated auth activity. Contact support for full log access.",
      });
    } catch (error: any) {
      toast({
        title: "Error loading auth logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      info: "default",
      warn: "secondary",
      error: "destructive",
    };
    return <Badge variant={variants[level] || "default"}>{level}</Badge>;
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Authentication Logs</h1>
          <p className="text-muted-foreground">Monitor user login and signup activity</p>
        </div>
        <Button onClick={loadAuthLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Auth Activity</CardTitle>
          <CardDescription>Latest authentication events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Full auth logs are available through the backend dashboard. This view shows user management capabilities.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent auth activity
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell>{log.msg}</TableCell>
                    <TableCell className="font-mono text-xs">{log.path || '-'}</TableCell>
                    <TableCell>
                      {log.status ? (
                        <Badge variant={log.status === '200' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
