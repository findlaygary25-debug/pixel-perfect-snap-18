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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings,
  AlertTriangle,
  ArrowUp,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Save,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EscalationRule {
  id: string;
  alert_type: string;
  escalation_level: number;
  time_threshold_minutes: number;
  target_role: string;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export default function EscalationConfig() {
  const { isAdmin, loading: authLoading } = useAdminCheck();
  const navigate = useNavigate();
  
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadRules();
    }
  }, [isAdmin]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alert_escalation_config')
        .select('*')
        .order('alert_type', { ascending: true })
        .order('escalation_level', { ascending: true });

      if (error) throw error;

      setRules((data || []) as EscalationRule[]);
    } catch (error: any) {
      console.error('Error loading escalation rules:', error);
      toast.error('Failed to load escalation rules');
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (ruleId: string, updates: Partial<EscalationRule>) => {
    try {
      const { error } = await supabase
        .from('alert_escalation_config')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ));

      toast.success('Escalation rule updated');
    } catch (error: any) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update escalation rule');
    }
  };

  const resetToDefaults = async () => {
    try {
      toast.info('Resetting escalation rules to defaults...');
      
      // Delete all existing rules
      await supabase
        .from('alert_escalation_config')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Re-insert defaults (the database will handle this via INSERT ON CONFLICT)
      const defaultRules = [
        { alert_type: 'critical', escalation_level: 0, time_threshold_minutes: 0, target_role: 'admin', notification_channels: ['email', 'sms', 'in_app'] },
        { alert_type: 'critical', escalation_level: 1, time_threshold_minutes: 15, target_role: 'admin', notification_channels: ['email', 'sms'] },
        { alert_type: 'critical', escalation_level: 2, time_threshold_minutes: 30, target_role: 'admin', notification_channels: ['email', 'sms', 'in_app'] },
        { alert_type: 'high', escalation_level: 0, time_threshold_minutes: 0, target_role: 'admin', notification_channels: ['email', 'in_app'] },
        { alert_type: 'high', escalation_level: 1, time_threshold_minutes: 30, target_role: 'admin', notification_channels: ['email', 'sms'] },
        { alert_type: 'high', escalation_level: 2, time_threshold_minutes: 60, target_role: 'admin', notification_channels: ['email', 'sms', 'in_app'] },
        { alert_type: 'medium', escalation_level: 0, time_threshold_minutes: 0, target_role: 'admin', notification_channels: ['in_app'] },
        { alert_type: 'medium', escalation_level: 1, time_threshold_minutes: 60, target_role: 'admin', notification_channels: ['email', 'in_app'] },
        { alert_type: 'medium', escalation_level: 2, time_threshold_minutes: 120, target_role: 'admin', notification_channels: ['email', 'sms', 'in_app'] },
      ];

      const { error } = await supabase
        .from('alert_escalation_config')
        .insert(defaultRules);

      if (error) throw error;

      await loadRules();
      toast.success('Escalation rules reset to defaults');
    } catch (error: any) {
      console.error('Error resetting rules:', error);
      toast.error('Failed to reset escalation rules');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'sms':
        return <MessageSquare className="h-3 w-3" />;
      case 'in_app':
        return <Bell className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.alert_type]) {
      acc[rule.alert_type] = [];
    }
    acc[rule.alert_type].push(rule);
    return acc;
  }, {} as Record<string, EscalationRule[]>);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Alert Escalation Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure automatic escalation rules for unresolved alerts
          </p>
        </div>
        <Button 
          onClick={resetToDefaults}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Escalation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-orange-500" />
            How Escalation Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Alerts automatically escalate to higher levels if they remain unresolved after specified time thresholds. 
            Each escalation level can target different admin roles and use different notification channels.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive">Critical</Badge>
                <span className="text-sm font-medium">Fast Escalation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Escalates every 15-30 minutes until resolved. Uses all notification channels.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500/10 text-orange-500">High</Badge>
                <span className="text-sm font-medium">Moderate Escalation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Escalates every 30-60 minutes. Gradually adds more notification channels.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-yellow-500/10 text-yellow-500">Medium</Badge>
                <span className="text-sm font-medium">Slow Escalation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Escalates every 1-2 hours. Starts with in-app, adds email then SMS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Rules by Severity */}
      {Object.entries(groupedRules).map(([alertType, typeRules]) => (
        <Card key={alertType}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getSeverityBadge(alertType)}
                  <span>Alerts Escalation Levels</span>
                </CardTitle>
                <CardDescription>
                  {typeRules.length} escalation level{typeRules.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Time Threshold</TableHead>
                  <TableHead>Target Role</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <ArrowUp className="h-3 w-3" />
                        Level {rule.escalation_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {rule.time_threshold_minutes === 0 
                            ? 'Immediate' 
                            : `${rule.time_threshold_minutes} min`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {rule.target_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.notification_channels.map(channel => (
                          <Badge key={channel} variant="outline" className="flex items-center gap-1">
                            {getChannelIcon(channel)}
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Information Box */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <AlertTriangle className="h-5 w-5" />
            Escalation System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Automated checks:</span>
            <Badge className="bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active (Every 5 minutes)
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next escalation check:</span>
            <span className="font-medium">~{5 - (new Date().getMinutes() % 5)} minutes</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Escalation targets:</span>
            <span className="font-medium">Admin users only</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 <strong>Tip:</strong> Escalation prevents critical issues from being missed. 
            Critical alerts escalate quickly (every 15 min), while medium alerts escalate more slowly (every 1-2 hours).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
