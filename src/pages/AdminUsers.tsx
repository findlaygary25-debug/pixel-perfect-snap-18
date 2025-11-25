import { useEffect, useState } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Edit, Key } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  username: string;
  created_at: string;
  avatar_url: string | null;
  is_private: boolean | null;
  account_region: string | null;
}

export default function AdminUsers() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetingPassword, setResetingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, created_at, avatar_url, is_private, account_region')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editingUser.username,
          account_region: editingUser.account_region,
          is_private: editingUser.is_private,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      toast({ title: "✅ User updated successfully" });
      setEditDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || !newPassword) {
      toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      return;
    }

    setResetingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.user_id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      toast({ title: "✅ Password reset successfully" });
      setPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Error resetting password", description: error.message, variant: "destructive" });
    } finally {
      setResetingPassword(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">View and manage all registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Complete list of registered members</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchQuery ? "No users found matching your search" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.avatar_url && (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {user.account_region ? (
                        <Badge variant="outline">{user.account_region}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_private ? (
                        <Badge variant="secondary">Private</Badge>
                      ) : (
                        <Badge variant="default">Public</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="region">Account Region</Label>
                <Input
                  id="region"
                  value={editingUser.account_region || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, account_region: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={editingUser.is_private || false}
                  onChange={(e) => setEditingUser({ ...editingUser, is_private: e.target.checked })}
                />
                <Label htmlFor="private">Private Account</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetingPassword}>
              {resetingPassword ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
