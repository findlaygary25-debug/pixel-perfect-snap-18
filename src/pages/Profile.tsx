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
import { Video, Bookmark, Settings, LogOut } from "lucide-react";

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
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
      fetchFollowerCounts(session.user.id)
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
      setProfile(data);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={profile?.username || ""}
                  onChange={(e) => setProfile({ ...profile!, username: e.target.value })}
                  onBlur={(e) => updateProfile({ username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Avatar URL</label>
                <Input
                  value={profile?.avatar_url || ""}
                  onChange={(e) => setProfile({ ...profile!, avatar_url: e.target.value })}
                  onBlur={(e) => updateProfile({ avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={profile?.bio || ""}
                  onChange={(e) => setProfile({ ...profile!, bio: e.target.value })}
                  onBlur={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
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
