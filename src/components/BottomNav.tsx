import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        // Fetch profile image
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            setProfileImageUrl(data?.avatar_url || null);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            setProfileImageUrl(data?.avatar_url || null);
          });
      } else {
        setProfileImageUrl(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto max-w-xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)]">
        <div className="flex items-center justify-between text-[11px]">
          
          {/* HOME */}
          <NavLink
            to="/"
            end
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <Home
              className={cn(
                "h-5 w-5",
                isActive("/") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "leading-none",
                isActive("/") ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              Home
            </span>
          </NavLink>

          {/* DISCOVER */}
          <NavLink
            to="/feed"
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <Compass
              className={cn(
                "h-5 w-5",
                isActive("/feed") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "leading-none",
                isActive("/feed") ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              Discover
            </span>
          </NavLink>

          {/* SPACER FOR PLUS BUTTON */}
          <div className="flex-1" />

          {/* INBOX */}
          <NavLink
            to="/activity"
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <MessageCircle
              className={cn(
                "h-5 w-5",
                isActive("/activity") ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "leading-none",
                isActive("/activity") ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              Inbox
            </span>
          </NavLink>

          {/* PROFILE */}
          <NavLink
            to={isAuthenticated ? "/profile" : "/login"}
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <div
              className={cn(
                "h-6 w-6 rounded-full overflow-hidden border",
                isActive("/profile") || isActive("/login")
                  ? "border-primary"
                  : "border-border"
              )}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <User
                    className={cn(
                      "h-4 w-4",
                      isActive("/profile") || isActive("/login") ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
              )}
            </div>
            <span
              className={cn(
                "leading-none",
                isActive("/profile") || isActive("/login") ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              Profile
            </span>
          </NavLink>
        </div>

        {/* BIG PLUS BUTTON (ADD VIDEO) */}
        <NavLink
          to="/upload"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground p-3 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-6 w-6" />
        </NavLink>
      </div>
    </nav>
  );
}
