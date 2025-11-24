import { Home, Video, Upload as UploadIcon, Store, Wallet, Users, Mail, Info, Palette, LogIn, User, Activity, BarChart3, Megaphone, HelpCircle, Share2, Youtube, CalendarClock, Radio, X, Settings, FolderHeart, Trophy, Gift, Shield, Bell, TrendingUp, FlaskConical, FileText, UserCog, KeyRound, LayoutDashboard, BellRing, ScrollText, AlertTriangle, ArrowUp, Mail as MailIcon, Menu, History, Bot, Layers, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/voice2fire-logo-new.png";
import { useState, useEffect } from "react";
import { AdvertiseDialog } from "@/components/AdvertiseDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
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

// Member items - visible to all authenticated users
const memberItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Recommendations", url: "/recommendations", icon: BookOpen },
  { title: "Lovable Store", url: "/lovable-store", icon: Store },
  { title: "Feed", url: "/feed", icon: Video },
  { title: "Go Live", url: "/live", icon: Radio },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Watch History", url: "/watch-history", icon: History },
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Import Videos", url: "/import", icon: Youtube },
  { title: "Import Manager", url: "/import-manager", icon: Layers },
  { title: "Scheduled", url: "/scheduled", icon: CalendarClock },
  { title: "Collections", url: "/collections", icon: FolderHeart },
  { title: "Store", url: "/store", icon: Store },
  { title: "Advertise", url: "/advertise", icon: Megaphone },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Challenge History", url: "/challenge-history", icon: Trophy },
  { title: "Rewards Store", url: "/rewards-store", icon: Gift },
  { title: "Shares", url: "/shares", icon: Share2 },
  { title: "Gifts", url: "/gifts", icon: Gift },
  { title: "Gift Leaderboard", url: "/gift-leaderboard", icon: Trophy },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Affiliate", url: "/affiliate", icon: Users },
  { title: "Video Studio", url: "/makeup", icon: Palette },
  { title: "Haptic Settings", url: "/haptic-settings", icon: Settings },
  { title: "Notification Preferences", url: "/notification-preferences", icon: Bell },
  { title: "About", url: "/about", icon: Info },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
  { title: "Contact", url: "/contact", icon: Mail },
];

// Admin-only items - visible only to admins
const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Affiliate Management", url: "/admin/affiliate", icon: UserCog },
  { title: "Flash Sales Admin", url: "/admin/flash-sales", icon: Shield },
  { title: "Role Management", url: "/admin/roles", icon: UserCog },
  { title: "Admin Bootstrap", url: "/admin/bootstrap", icon: KeyRound },
  { title: "Admin Notifications", url: "/admin/notification-preferences", icon: BellRing },
  { title: "Notification Logs", url: "/admin/notification-logs", icon: ScrollText },
  { title: "Delivery Alerts", url: "/admin/delivery-alerts", icon: AlertTriangle },
  { title: "Escalation Rules", url: "/admin/escalation-config", icon: ArrowUp },
  { title: "Template Editor", url: "/admin/templates", icon: MailIcon },
  { title: "Notification Analytics", url: "/notification-analytics", icon: TrendingUp },
  { title: "A/B Testing", url: "/notification-ab-tests", icon: FlaskConical },
  { title: "PII Audit Logs", url: "/pii-audit-logs", icon: FileText },
  { title: "AI Monitor", url: "/admin/ai-monitor", icon: Bot },
];

export function AppSidebar() {
  const { state, toggleSidebar, open, setOpen } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [advertiseDialogOpen, setAdvertiseDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isAdmin, isAdminOrModerator, loading: roleLoading } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Build menu items based on user role
  const getMenuItems = () => {
    const items = [...memberItems];
    
    // Add admin items if user is admin or moderator
    if (isAdminOrModerator && !roleLoading) {
      items.push(...adminItems);
    }
    
    // Add profile or login
    items.push(
      isAuthenticated 
        ? { title: "Profile", url: "/profile", icon: User }
        : { title: "Login", url: "/login", icon: LogIn }
    );
    
    return items;
  };

  const items = getMenuItems();

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

  return (
    <>
      {/* Dark overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sliding menu */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          transition-transform duration-300
          w-[240px]
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header with menu icon and logo */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sidebar-border">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img 
            src={logo} 
            alt="Voice2Fire" 
            className="h-10 w-auto"
          />
        </div>

        {/* Menu content */}
        <div className="overflow-y-auto pb-20 px-2 h-[calc(100%-60px)]">
          <SidebarGroup>
            <SidebarGroupContent>
              {menuContent}
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </aside>

      <AdvertiseDialog 
        open={advertiseDialogOpen} 
        onOpenChange={setAdvertiseDialogOpen} 
      />
    </>
  );
}
