import { Home, Upload, User, Bell, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {/* Social Media Icons Bar */}
      <div className="fixed bottom-16 left-0 right-0 h-12 bg-background/95 backdrop-blur-sm border-t md:hidden z-40">
        <div className="flex items-center justify-center gap-6 h-full px-4">
          <a
            href="https://tiktok.com/@voice2fire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="TikTok"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a
            href="https://facebook.com/voice2fire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://instagram.com/voice2fire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://youtube.com/@voice2fire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="YouTube"
          >
            <Youtube className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com/voice2fire"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t md:hidden z-50">
        <div className="flex items-center justify-around h-full px-4">
        <NavLink
          to="/"
          end
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </NavLink>

        <NavLink
          to="/activity"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary"
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs">Inbox</span>
        </NavLink>

        <NavLink
          to="/upload"
          className="flex flex-col items-center -mt-6"
        >
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow">
            <Upload className="h-7 w-7" />
          </div>
        </NavLink>

        {isAuthenticated ? (
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            activeClassName="text-primary"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            activeClassName="text-primary"
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Login</span>
          </NavLink>
        )}

        <NavLink
          to="/feed"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs">Feed</span>
        </NavLink>
        </div>
      </nav>
    </>
  );
}
