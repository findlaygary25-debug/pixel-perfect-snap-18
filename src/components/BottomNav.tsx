import { Home, Upload, User, Video, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";

export function BottomNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toggleSidebar } = useSidebar();

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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t md:hidden z-50">
      <div className="flex items-center justify-around h-full px-2">
        <NavLink
          to="/"
          end
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-w-[60px]"
          activeClassName="text-primary"
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/feed"
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-w-[60px]"
          activeClassName="text-primary"
        >
          <Video className="h-6 w-6" />
          <span className="text-[10px] font-medium">Feed</span>
        </NavLink>

        <NavLink
          to="/upload"
          className="flex flex-col items-center -mt-6 min-w-[60px]"
        >
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow">
            <Upload className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">Upload</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? "/profile" : "/login"}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-w-[60px]"
          activeClassName="text-primary"
        >
          <User className="h-6 w-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>

        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-w-[60px]"
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
