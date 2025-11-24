import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Users } from "lucide-react";

interface User {
  user_id: string;
  username: string;
}

interface AffiliateLink {
  user_id: string;
  sponsor_id: string | null;
  username: string;
  sponsor_username: string | null;
}

export default function AdminAffiliate() {
  const { isAdmin, loading } = useAdminCheck();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAffiliates();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, username")
      .order("username");
    if (data) setUsers(data);
  };

  const fetchAffiliates = async () => {
    const { data } = await supabase
      .from("affiliate_links")
      .select(`
        user_id,
        sponsor_id,
        profiles!affiliate_links_user_id_fkey(username),
        sponsor:profiles!affiliate_links_sponsor_id_fkey(username)
      `);
    
    if (data) {
      const mapped = data.map((a: any) => ({
        user_id: a.user_id,
        sponsor_id: a.sponsor_id,
        username: a.profiles?.username || "Unknown",
        sponsor_username: a.sponsor?.username || null
      }));
      setAffiliates(mapped);
    }
  };

  const handleSetSponsor = async () => {
    if (!selectedUserId || !selectedSponsorId) {
      toast({
        title: "Error",
        description: "Please select both user and sponsor",
        variant: "destructive"
      });
      return;
    }

    if (selectedUserId === selectedSponsorId) {
      toast({
        title: "Error",
        description: "User cannot be their own sponsor",
        variant: "destructive"
      });
      return;
    }

    // Update or insert affiliate link
    const { error } = await supabase
      .from("affiliate_links")
      .upsert({
        user_id: selectedUserId,
        sponsor_id: selectedSponsorId,
        level: 1
      });

    // Also update the referred_by in profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ referred_by: selectedSponsorId })
      .eq("user_id", selectedUserId);

    if (error || profileError) {
      toast({
        title: "Error",
        description: "Failed to update sponsor",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Sponsor updated successfully"
      });
      fetchAffiliates();
      setSelectedUserId("");
      setSelectedSponsorId("");
    }
  };

  const filteredAffiliates = affiliates.filter(a =>
    a.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading...</div>;
  if (!isAdmin) return <div className="p-8">Access denied</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
        <p className="text-muted-foreground">Manage affiliate relationships and sponsorships</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Set Sponsor
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select user...</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.username}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Sponsor (who will benefit)</Label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                value={selectedSponsorId}
                onChange={(e) => setSelectedSponsorId(e.target.value)}
              >
                <option value="">Select sponsor...</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>{u.username}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleSetSponsor} className="w-full">
              Set Sponsor
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Relationships</h2>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredAffiliates.map(a => (
              <div key={a.user_id} className="p-3 border rounded-lg">
                <div className="font-medium">{a.username}</div>
                <div className="text-sm text-muted-foreground">
                  Sponsor: {a.sponsor_username || "None"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
