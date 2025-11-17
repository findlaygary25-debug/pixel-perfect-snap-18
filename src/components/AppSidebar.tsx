import { Home, Video, Upload as UploadIcon, Store, Wallet, Users, Mail, Info, Palette, LogIn, User, Activity, BarChart3, Megaphone, HelpCircle, Share2, Youtube, CalendarClock, Radio, X, Settings, FolderHeart, Trophy, Gift, Shield, Bell } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { AdvertiseDialog } from "@/components/AdvertiseDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  { title: "Collections", url: "/collections", icon: FolderHeart },
  { title: "Store", url: "/store", icon: Store },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Challenge History", url: "/challenge-history", icon: Trophy },
  { title: "Rewards Store", url: "/rewards-store", icon: Gift },
  { title: "Flash Sales Admin", url: "/admin/flash-sales", icon: Shield },
  { title: "Shares", url: "/shares", icon: Share2 },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Affiliate", url: "/affiliate", icon: Users },
  { title: "Makeup", url: "/makeup", icon: Palette },
  { title: "Haptic Settings", url: "/haptic-settings", icon: Settings },
  { title: "Notification Preferences", url: "/notification-preferences", icon: Bell },
  { title: "About", url: "/about", icon: Info },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
  { title: "Contact", url: "/contact", icon: Mail },
];

export function AppSidebar() {
  const { state, toggleSidebar, open, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advertiseDialogOpen, setAdvertiseDialogOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const menuContent = (
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
                if (isMobile && open) {
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
              if (isMobile && open) {
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
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="h-[85vh] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
            <div className="mx-auto mt-4 mb-2 relative">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 animate-pulse" />
              <div className="absolute inset-0 h-1.5 w-12 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            <DrawerHeader className="border-b pt-2">
              <DrawerTitle className="flex items-center justify-between">
                <span>Voice2Fire</span>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto pb-20 px-2">
              <SidebarGroup>
                <SidebarGroupContent>
                  {menuContent}
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          </DrawerContent>
        </Drawer>

        <AdvertiseDialog 
          open={advertiseDialogOpen} 
          onOpenChange={setAdvertiseDialogOpen} 
        />
      </>
    );
  }

  return (
    <>
      <Sidebar 
        className="[--sidebar-width:var(--side-width)] [--sidebar-width-icon:var(--side-folded-width)]" 
        collapsible="icon"
        side="left"
      >
        <SidebarContent className="pb-20">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm px-3">
              Voice2Fire
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {menuContent}
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
