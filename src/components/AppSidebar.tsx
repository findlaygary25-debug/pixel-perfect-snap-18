import { Home, Video, Upload as UploadIcon, Store, Wallet, Users, Mail, Info, Palette, LogIn, User, Activity, BarChart3, Megaphone, HelpCircle, Share2, Youtube, CalendarClock, Radio, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { AdvertiseDialog } from "@/components/AdvertiseDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const baseItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: Video },
  { title: "Go Live", url: "/live", icon: Radio },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Import Videos", url: "/import", icon: Youtube },
  { title: "Scheduled", url: "/scheduled", icon: CalendarClock },
  { title: "Store", url: "/store", icon: Store },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Shares", url: "/shares", icon: Share2 },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Affiliate", url: "/affiliate", icon: Users },
  { title: "Makeup", url: "/makeup", icon: Palette },
  { title: "About", url: "/about", icon: Info },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
  { title: "Contact", url: "/contact", icon: Mail },
];

export function AppSidebar() {
  const { state, toggleSidebar, open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advertiseDialogOpen, setAdvertiseDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const items = [
    ...baseItems,
    isAuthenticated 
      ? { title: "Profile", url: "/profile", icon: User }
      : { title: "Login", url: "/login", icon: LogIn }
  ];

  return (
    <>
      <Sidebar 
        className="w-64 md:w-48" 
        collapsible="offcanvas"
        side="left"
      >
        <SidebarContent className="pb-20">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm px-3 flex items-center justify-between">
              <span>Voice2Fire</span>
              <button 
                onClick={() => toggleSidebar()}
                className="md:hidden p-1 hover:bg-muted rounded"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="px-3 py-3 gap-3 min-h-[44px]">
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                        onClick={() => {
                          // Close sidebar on mobile after navigation
                          if (window.innerWidth < 768 && open) {
                            toggleSidebar();
                          }
                        }}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {isAuthenticated && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => {
                        setAdvertiseDialogOpen(true);
                        // Close sidebar on mobile after opening dialog
                        if (window.innerWidth < 768 && open) {
                          toggleSidebar();
                        }
                      }} 
                      className="px-3 py-3 gap-3 min-h-[44px]"
                    >
                      <Megaphone className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm truncate">Advertise</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AdvertiseDialog 
        open={advertiseDialogOpen} 
        onOpenChange={setAdvertiseDialogOpen} 
      />
    </>
  );
}
