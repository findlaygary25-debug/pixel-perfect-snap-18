import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, UserPlus, UserMinus, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type UserRole = {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  granted_at: string;
  profile?: {
    username: string;
  };
};

type RoleAudit = {
  id: string;
  user_id: string;
  role: string;
  action: string;
  changed_at: string;
  reason: string | null;
  profile?: {
    username: string;
  };
};

type AppRole = "admin" | "moderator" | "user";

export default function AdminRoles() {
  const { isAdmin, loading: adminLoading } = useAdminCheck(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<RoleAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [reason, setReason] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username")
        .order("username");

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("granted_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Enrich with profile data
      const enrichedRoles = rolesData?.map(role => ({
        ...role,
        profile: profilesData?.find(p => p.user_id === role.user_id)
      })) || [];

      setUserRoles(enrichedRoles);

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from("role_change_audit")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      const enrichedAudit = auditData?.map(audit => ({
        ...audit,
        profile: profilesData?.find(p => p.user_id === audit.user_id)
      })) || [];

      setAuditLogs(enrichedAudit);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load roles data");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Please select a user and role");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("grant_user_role", {
        target_user_id: selectedUserId,
        target_role: selectedRole,
        audit_reason: reason || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        toast.success(result.message || "Role granted successfully");
        setGrantDialogOpen(false);
        setSelectedUserId("");
        setSelectedRole("user");
        setReason("");
        fetchData();
      } else {
        toast.error(result.error || "Failed to grant role");
      }
    } catch (error: any) {
      console.error("Error granting role:", error);
      toast.error(error.message || "Failed to grant role");
    }
  };

  const handleRevokeRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    try {
      const { data, error } = await supabase.rpc("revoke_user_role", {
        target_user_id: userId,
        target_role: role,
        audit_reason: reason || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        toast.success(result.message || "Role revoked successfully");
        setRevokeDialogOpen(false);
        setReason("");
        fetchData();
      } else {
        toast.error(result.error || "Failed to revoke role");
      }
    } catch (error: any) {
      console.error("Error revoking role:", error);
      toast.error(error.message || "Failed to revoke role");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "default";
      default:
        return "secondary";
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Role Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and permissions with full audit trail
            </p>
          </div>

          <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Grant Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant User Role</DialogTitle>
                <DialogDescription>
                  Assign a role to a user. This action will be logged in the audit trail.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "admin" | "moderator" | "user")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reason (optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this role being granted?"
                    rows={3}
                  />
                </div>

                <Button onClick={handleGrantRole} className="w-full">
                  Grant Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current User Roles</CardTitle>
            <CardDescription>
              Users with elevated permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Granted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No roles assigned yet
                    </TableCell>
                  </TableRow>
                ) : (
                  userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.profile?.username || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userRole.role)}>
                          {userRole.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(userRole.granted_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <UserMinus className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Revoke Role</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to revoke the {userRole.role} role from{" "}
                                {userRole.profile?.username}?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Reason (optional)</Label>
                                <Textarea
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="Why is this role being revoked?"
                                  rows={3}
                                />
                              </div>
                              <Button
                                variant="destructive"
                                onClick={() => handleRevokeRole(userRole.user_id, userRole.role)}
                                className="w-full"
                              >
                                Confirm Revoke
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Recent role changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No audit logs yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.profile?.username || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action === "granted" ? "default" : "destructive"}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.reason || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.changed_at).toLocaleString()}
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
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> Admin roles grant full access to the system, including the
              ability to manage flash sales, promotional banners, and reward items. Only grant admin
              access to trusted users. All role changes are logged and cannot be undone without a trace.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
