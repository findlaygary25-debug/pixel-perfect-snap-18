import { Home, Video, Upload as UploadIcon, Store, Wallet, Users, Mail, Info, Palette, LogIn, User, Activity, BarChart3, Megaphone, HelpCircle, Share2, Youtube, CalendarClock, Radio, X, Settings, FolderHeart, Trophy, Gift, Shield, Bell, TrendingUp, FlaskConical, FileText, UserCog, KeyRound, LayoutDashboard, BellRing, ScrollText, AlertTriangle, ArrowUp, Mail as MailIcon, Menu, History, Bot, Layers, BookOpen, Scale, Headphones } from "lucide-react";
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

// Menu structure with submenus
interface MenuItem {
  title: string;
  url?: string;
  icon: any;
  submenu?: MenuItem[];
}

// Content & Media
const contentItems: MenuItem[] = [
  { title: "Home", url: "/", icon: Home },
  { title: "Feed", url: "/feed", icon: Video },
  { title: "Watch History", url: "/watch-history", icon: History },
  { title: "Collections", url: "/collections", icon: FolderHeart },
];

// Creation & Upload
const creationItems: MenuItem[] = [
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Go Live", url: "/live", icon: Radio },
  { title: "Import Videos", url: "/import", icon: Youtube },
  { title: "Import Manager", url: "/import-manager", icon: Layers },
  { title: "Scheduled", url: "/scheduled", icon: CalendarClock },
  { title: "Video Studio", url: "/makeup", icon: Palette },
];

// Store & Commerce
const storeItems: MenuItem[] = [
  { title: "Lovable Store", url: "/lovable-store", icon: Store },
  { title: "My Store", url: "/store", icon: Store },
  { title: "Recommendations", url: "/recommendations", icon: BookOpen },
  { title: "Wallet", url: "/wallet", icon: Wallet },
];

// Gifts & Rewards
const giftsRewardsItems: MenuItem[] = [
  { title: "Gifts", url: "/gifts", icon: Gift },
  { title: "Gift Leaderboard", url: "/gift-leaderboard", icon: Trophy },
  { title: "Rewards Store", url: "/rewards-store", icon: Gift },
  { title: "Challenge History", url: "/challenge-history", icon: Trophy },
];

// Marketing & Growth
const marketingItems: MenuItem[] = [
  { title: "Advertise", url: "/advertise", icon: Megaphone },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Shares", url: "/shares", icon: Share2 },
  { title: "Affiliate", url: "/affiliate", icon: Users },
  { title: "Activity", url: "/activity", icon: Activity },
];

// Settings & Support
const settingsItems: MenuItem[] = [
  { title: "Notification Preferences", url: "/notification-preferences", icon: Bell },
  { title: "Haptic Settings", url: "/haptic-settings", icon: Settings },
  { title: "About", url: "/about", icon: Info },
  { title: "FAQ", url: "/faq", icon: HelpCircle },
  { title: "Contact", url: "/contact", icon: Mail },
  { title: "Terms & Conditions", url: "/legal", icon: Scale },
];

// A1 - Top Level Admin items
const a1AdminItems: MenuItem[] = [
  { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Role Management", url: "/admin/roles", icon: UserCog },
  { title: "Admin Bootstrap", url: "/admin/bootstrap", icon: KeyRound },
  { title: "Upload Settings", url: "/admin/upload-settings", icon: Settings },
];

// A2 - Admin Special Guest items  
const a2AdminItems: MenuItem[] = [
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Auth Logs", url: "/admin/auth-logs", icon: Shield },
  { title: "Affiliate Management", url: "/admin/affiliate", icon: UserCog },
  { title: "Flash Sales Admin", url: "/admin/flash-sales", icon: Shield },
  { title: "PII Audit Logs", url: "/pii-audit-logs", icon: FileText },
];

// M1 - Moderators items
const m1ModeratorItems: MenuItem[] = [
  { title: "AI Monitor", url: "/admin/ai-monitor", icon: Bot },
  { title: "Admin Notifications", url: "/admin/notification-preferences", icon: BellRing },
  { title: "Notification Logs", url: "/admin/notification-logs", icon: ScrollText },
  { title: "Delivery Alerts", url: "/admin/delivery-alerts", icon: AlertTriangle },
  { title: "Escalation Rules", url: "/admin/escalation-config", icon: ArrowUp },
  { title: "Template Editor", url: "/admin/templates", icon: MailIcon },
  { title: "Notification Analytics", url: "/notification-analytics", icon: TrendingUp },
  { title: "A/B Testing", url: "/notification-ab-tests", icon: FlaskConical },
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

  // Build menu sections based on user role
  const getMenuSections = () => {
    const sections = [
      { title: "Content & Media", items: contentItems },
      { title: "Creation & Upload", items: creationItems },
      { title: "Store & Commerce", items: storeItems },
      { title: "Gifts & Rewards", items: giftsRewardsItems },
      { title: "Marketing & Growth", items: marketingItems },
      { title: "Settings & Support", items: settingsItems },
    ];
    
    // Add admin sections based on role
    if (isAdminOrModerator && !roleLoading) {
      // A1 - Top Level Admin (admin role)
      if (isAdmin) {
        sections.push({ title: "A1 - Top Admin", items: a1AdminItems });
        sections.push({ title: "A2 - Admin Special", items: a2AdminItems });
      }
      
      // M1 - Moderators (moderator role or admin)
      sections.push({ title: "M1 - Moderators", items: m1ModeratorItems });
    }
    
    return sections;
  };

  const sections = getMenuSections();

  const menuContent = (
    <div className="space-y-1">
      {sections.map((section) => (
        <SidebarGroup key={section.title} className="py-2">
          <SidebarGroupLabel className="px-3 text-xs font-bold uppercase tracking-wider text-primary">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="px-3 py-2.5 gap-3 min-h-[40px]">
                    <NavLink
                      to={item.url!}
                      end
                      className="hover:bg-muted/50 font-semibold"
                      activeClassName="bg-muted text-primary font-bold"
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
      
      {/* Profile or Login */}
      <SidebarGroup className="py-2 border-t border-sidebar-border">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-3 py-2.5 gap-3 min-h-[40px]">
                <NavLink
                  to={isAuthenticated ? "/profile" : "/login"}
                  end
                  className="hover:bg-muted/50 font-semibold"
                  activeClassName="bg-muted text-primary font-bold"
                  onClick={() => {
                    if (isMobile && open) {
                      toggleSidebar();
                    }
                  }}
                >
                  {isAuthenticated ? <User className="h-5 w-5 flex-shrink-0" /> : <LogIn className="h-5 w-5 flex-shrink-0" />}
                  <span className="text-sm truncate">{isAuthenticated ? "Profile" : "Login"}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
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
          {menuContent}
        </div>
      </aside>

      <AdvertiseDialog 
        open={advertiseDialogOpen} 
        onOpenChange={setAdvertiseDialogOpen} 
      />
    </>
  );
}
