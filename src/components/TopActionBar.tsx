import { useState, useEffect } from "react";
import { Coins, Smartphone, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopActionBar() {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fetch profile avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    }
  };

  

  return (
    <div className="flex items-center gap-2">
      {/* Coins/Wallet Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/wallet")}
        className="relative rounded-full"
        aria-label="Wallet"
      >
        <Coins className="h-5 w-5" />
      </Button>

      {/* Mobile/Device Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        aria-label="Device notifications"
      >
        <Smartphone className="h-5 w-5" />
      </Button>

      {/* Vertical Divider */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Admin Notifications */}
      <AdminNotificationBell />
      
      {/* User Notifications */}
      <NotificationBell />

      {/* Profile Avatar Button with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="relative rounded-full h-8 w-8 p-0 overflow-hidden"
            aria-label="Profile"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
