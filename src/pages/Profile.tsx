import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Video, Bookmark, Settings, LogOut, Lock, Shield, Download, Trash2, Globe, UserX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { PersonSchema } from "@/components/PersonSchema";

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  is_private: boolean;
  account_region: string;
  social_links: {
    youtube?: string;
    tiktok?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  } | null;
}

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Video {
  id: string;
  video_url: string;
  caption: string | null;
  views: number;
  likes: number;
  created_at: string;
}

interface BookmarkedVideo extends Video {
  bookmark_id: string;
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedVideo[]>([]);
  const [followingFollowerCounts, setFollowingFollowerCounts] = useState<Record<string, { followers: number; following: number }>>({});
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);
    await Promise.all([
      fetchProfile(session.user.id),
      fetchVideos(session.user.id),
      fetchBookmarks(session.user.id),
      fetchFollowerCounts(session.user.id),
      fetchBlockedUsers(session.user.id)
    ]);
    setLoading(false);
  };

  const fetchFollowerCounts = async (userId: string) => {
    try {
      const [followersData, followingData] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact" }).eq("followed_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", userId)
      ]);

      setFollowingFollowerCounts({
        [userId]: {
          followers: followersData.count || 0,
          following: followingData.count || 0
        }
      });
    } catch (error) {
      console.error("Error fetching follower counts:", error);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      toast({ title: "Error loading profile", variant: "destructive" });
    } else {
      setProfile({
        ...data,
        social_links: data.social_links as Profile['social_links']
      });
    }
  };

  const fetchVideos = async (userId: string) => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setVideos(data || []);
  };

  const fetchBookmarks = async (userId: string) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        id,
        video_id,
        videos (
          id,
          video_url,
          caption,
          views,
          likes,
          created_at
        )
      `)
      .eq("user_id", userId);
    
    if (!error && data) {
      const bookmarkedVideos = data
        .filter(item => item.videos)
        .map(item => ({
          ...(item.videos as any),
          bookmark_id: item.id
        }));
      setBookmarks(bookmarkedVideos);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    
    if (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      setProfile({ ...profile, ...updates } as Profile);
    }
  };

  const fetchBlockedUsers = async (userId: string) => {
    const { data, error } = await supabase
      .from("blocked_users")
      .select(`
        id,
        blocked_user_id,
        profiles!blocked_users_blocked_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("user_id", userId);
    
    if (!error && data) {
      setBlockedUsers(data as unknown as BlockedUser[]);
    }
  };

  const handlePrivacyToggle = async (isPrivate: boolean) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_private: isPrivate })
      .eq("user_id", user.id);
    
    if (error) {
      toast({ title: "Error updating privacy setting", variant: "destructive" });
    } else {
      setProfile(prev => prev ? { ...prev, is_private: isPrivate } : null);
      toast({ title: "Privacy setting updated" });
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("user_id", user.id)
      .eq("blocked_user_id", blockedUserId);
    
    if (error) {
      toast({ title: "Error unblocking user", variant: "destructive" });
    } else {
      setBlockedUsers(prev => prev.filter(bu => bu.blocked_user_id !== blockedUserId));
      toast({ title: "User unblocked" });
    }
  };

  const handleDownloadData = async () => {
    if (!user || !profile) return;
    
    const data = {
      profile,
      videos,
      bookmarks,
      followers: followingFollowerCounts[user.id]?.followers || 0,
      following: followingFollowerCounts[user.id]?.following || 0,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice2fire_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Data downloaded successfully" });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      toast({ 
        title: "Error deleting account", 
        description: "Please contact support for assistance.",
        variant: "destructive" 
      });
    } else {
      toast({ title: "Account deleted" });
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const removeBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId);
    
    if (error) {
      toast({ title: "Error removing bookmark", variant: "destructive" });
    } else {
      setBookmarks(bookmarks.filter(b => b.bookmark_id !== bookmarkId));
      toast({ title: "Bookmark removed" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container max-w-6xl py-8">
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://voice2fire.com/" },
          { name: "Profile", url: "https://voice2fire.com/profile" }
        ]}
      />
      {user && profile && (
        <PersonSchema
          userId={user.id}
          name={profile.username}
          image={profile.avatar_url || undefined}
          description={profile.bio || undefined}
          email={user.email}
          url={`https://voice2fire.com/profile/${user.id}`}
          followers={followingFollowerCounts[user.id]?.followers || 0}
          following={followingFollowerCounts[user.id]?.following || 0}
          numberOfVideos={videos.length}
        />
      )}
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile?.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile?.username}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          {profile?.bio && <p className="mt-2">{profile.bio}</p>}
          <div className="flex gap-4 mt-2 text-sm">
            <span><strong>{followingFollowerCounts[user?.id]?.followers || 0}</strong> followers</span>
            <span><strong>{followingFollowerCounts[user?.id]?.following || 0}</strong> following</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Videos ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarks">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarks ({bookmarks.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-4">
                  <video src={video.video_url} className="w-full rounded-md mb-2" controls />
                  <p className="text-sm mb-2">{video.caption}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>👁 {video.views}</span>
                    <span>❤️ {video.likes}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {videos.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No videos uploaded yet
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bookmarks.map((video) => (
              <Card key={video.id}>
                <CardContent className="p-4">
                  <video src={video.video_url} className="w-full rounded-md mb-2" controls />
                  <p className="text-sm mb-2">{video.caption}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBookmark(video.bookmark_id)}
                  >
                    Remove Bookmark
                  </Button>
                </CardContent>
              </Card>
            ))}
            {bookmarks.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No bookmarks yet
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          {/* Account Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Account Control
              </CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your account region is initially set based on the time and place of registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Account Region</Label>
                <span className="text-muted-foreground">{profile?.account_region || 'New Zealand'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>Manage your privacy and discoverability settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="private-account">Private Account</Label>
                  <p className="text-sm text-muted-foreground">
                    With a private account, only users you approve can follow you and watch your videos
                  </p>
                </div>
                <Switch
                  id="private-account"
                  checked={profile?.is_private || false}
                  onCheckedChange={handlePrivacyToggle}
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Blocked Accounts
                </Label>
                {blockedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven't blocked anyone yet</p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={blockedUser.profiles.avatar_url || undefined} />
                            <AvatarFallback>{blockedUser.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{blockedUser.profiles.username}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(blockedUser.blocked_user_id)}
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data
              </CardTitle>
              <CardDescription>Download a copy of your Voice2Fire data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadData} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Your Data
              </Button>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">
                      {profile?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      id="avatar-upload-settings"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !user) return;
                        
                        const fileExt = file.name.split('.').pop();
                        const filePath = `${user.id}-${Math.random()}.${fileExt}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('avatars')
                          .upload(filePath, file, { upsert: true });
                        
                        if (uploadError) {
                          toast({ title: "Error uploading image", variant: "destructive", description: uploadError.message });
                          return;
                        }
                        
                        const { data: { publicUrl } } = supabase.storage
                          .from('avatars')
                          .getPublicUrl(filePath);
                        
                        await updateProfile({ avatar_url: publicUrl });
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload-settings')?.click()}
                    >
                      Upload New Picture
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={profile?.username || ""}
                  onChange={(e) => setProfile({ ...profile!, username: e.target.value })}
                  onBlur={(e) => updateProfile({ username: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile({ ...profile!, bio: e.target.value })}
                  onBlur={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  value={profile?.website_url || ""}
                  onChange={(e) => setProfile({ ...profile!, website_url: e.target.value })}
                  onBlur={(e) => updateProfile({ website_url: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium block">Social Media Links</label>
                
                <div>
                  <label className="text-xs text-muted-foreground">YouTube</label>
                  <Input
                    value={profile?.social_links?.youtube || ""}
                    onChange={(e) => {
                      const updated = { ...profile!, social_links: { ...profile?.social_links, youtube: e.target.value } };
                      setProfile(updated);
                    }}
                    onBlur={(e) => updateProfile({ 
                      social_links: { ...profile?.social_links, youtube: e.target.value } 
                    })}
                    placeholder="https://youtube.com/@username"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">TikTok</label>
                  <Input
                    value={profile?.social_links?.tiktok || ""}
                    onChange={(e) => {
                      const updated = { ...profile!, social_links: { ...profile?.social_links, tiktok: e.target.value } };
                      setProfile(updated);
                    }}
                    onBlur={(e) => updateProfile({ 
                      social_links: { ...profile?.social_links, tiktok: e.target.value } 
                    })}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Instagram</label>
                  <Input
                    value={profile?.social_links?.instagram || ""}
                    onChange={(e) => {
                      const updated = { ...profile!, social_links: { ...profile?.social_links, instagram: e.target.value } };
                      setProfile(updated);
                    }}
                    onBlur={(e) => updateProfile({ 
                      social_links: { ...profile?.social_links, instagram: e.target.value } 
                    })}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Twitter</label>
                  <Input
                    value={profile?.social_links?.twitter || ""}
                    onChange={(e) => {
                      const updated = { ...profile!, social_links: { ...profile?.social_links, twitter: e.target.value } };
                      setProfile(updated);
                    }}
                    onBlur={(e) => updateProfile({ 
                      social_links: { ...profile?.social_links, twitter: e.target.value } 
                    })}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Facebook</label>
                  <Input
                    value={profile?.social_links?.facebook || ""}
                    onChange={(e) => {
                      const updated = { ...profile!, social_links: { ...profile?.social_links, facebook: e.target.value } };
                      setProfile(updated);
                    }}
                    onBlur={(e) => updateProfile({ 
                      social_links: { ...profile?.social_links, facebook: e.target.value } 
                    })}
                    placeholder="https://facebook.com/username"
                  />
                </div>
              </div>
              
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
