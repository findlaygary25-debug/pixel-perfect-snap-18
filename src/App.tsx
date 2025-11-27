import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AIChatbot } from "@/components/AIChatbot";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import { TopActionBar } from "@/components/TopActionBar";
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
import { FlashSaleAlert } from "@/components/FlashSaleAlert";
import React from "react";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Activity from "./pages/Activity";
import Upload from "./pages/Upload";
import Store from "./pages/Store";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Wallet from "./pages/Wallet";
import Affiliate from "./pages/Affiliate";
import Makeup from "./pages/Makeup";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Shares from "./pages/Shares";
import ImportVideos from "./pages/ImportVideos";
import ImportManager from "./pages/ImportManager";
import ScheduledVideos from "./pages/ScheduledVideos";
import Live from "./pages/Live";
import HapticSettings from "./pages/HapticSettings";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import ChallengeHistory from "./pages/ChallengeHistory";
import RewardsStore from "./pages/RewardsStore";
import AdminFlashSales from "./pages/AdminFlashSales";
import NotificationPreferences from "./pages/NotificationPreferences";
import NotificationAnalytics from "./pages/NotificationAnalytics";
import NotificationABTests from "./pages/NotificationABTests";
import PIIAuditLogs from "./pages/PIIAuditLogs";
import AIMonitor from "./pages/AIMonitor";
import Recommendations from "./pages/Recommendations";
import LovableStore from "./pages/LovableStore";
import AdminRoles from "./pages/AdminRoles";
import AdminBootstrap from "./pages/AdminBootstrap";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAuthLogs from "./pages/AdminAuthLogs";
import AdminAffiliate from "./pages/AdminAffiliate";
import AdminUploadSettings from "./pages/AdminUploadSettings";
import Voice2FireLegal from "./components/Voice2FireLegal";
import AdminNotificationPreferences from "./pages/AdminNotificationPreferences";
import NotificationDeliveryLogs from "./pages/NotificationDeliveryLogs";
import DeliveryAlerts from "./pages/DeliveryAlerts";
import EscalationConfig from "./pages/EscalationConfig";
import NotificationTemplates from "./pages/NotificationTemplates";
import NotificationTemplateEditor from "./pages/NotificationTemplateEditor";
import Gifts from "./pages/Gifts";
import GiftLeaderboard from "./pages/GiftLeaderboard";
import WatchHistory from "./pages/WatchHistory";
import Advertise from "./pages/Advertise";
import NotFound from "./pages/NotFound";
import AudioPlayer from "./pages/AudioPlayer";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          <header className="h-12 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 flex items-center justify-center">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <a href="/" className="flex items-center">
                <img 
                  src="/favicon.png" 
                  alt="Voice2Fire"
                  className="h-10 w-auto object-contain hover-scale cursor-pointer"
                />
              </a>
            </div>
            <TopActionBar />
          </header>
          <main className="flex-1 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/affiliate" element={<Affiliate />} />
                  <Route path="/makeup" element={<Makeup />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/legal" element={<Voice2FireLegal />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/shares" element={<Shares />} />
          <Route path="/import" element={<ImportVideos />} />
          <Route path="/import-manager" element={<ImportManager />} />
          <Route path="/scheduled" element={<ScheduledVideos />} />
          <Route path="/live" element={<Live />} />
          <Route path="/haptic-settings" element={<HapticSettings />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/challenge-history" element={<ChallengeHistory />} />
          <Route path="/rewards-store" element={<RewardsStore />} />
          <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/auth-logs" element={<AdminAuthLogs />} />
          <Route path="/admin/affiliate" element={<AdminAffiliate />} />
          <Route path="/admin/upload-settings" element={<AdminUploadSettings />} />
          <Route path="/admin/flash-sales" element={<AdminFlashSales />} />
          <Route path="/notification-preferences" element={<NotificationPreferences />} />
          <Route path="/notification-analytics" element={<NotificationAnalytics />} />
          <Route path="/notification-ab-tests" element={<NotificationABTests />} />
          <Route path="/pii-audit-logs" element={<PIIAuditLogs />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/bootstrap" element={<AdminBootstrap />} />
          <Route path="/admin/notification-preferences" element={<AdminNotificationPreferences />} />
          <Route path="/admin/notification-logs" element={<NotificationDeliveryLogs />} />
          <Route path="/admin/delivery-alerts" element={<DeliveryAlerts />} />
          <Route path="/admin/escalation-config" element={<EscalationConfig />} />
          <Route path="/admin/ai-monitor" element={<AIMonitor />} />
          <Route path="/admin/templates" element={<NotificationTemplates />} />
          <Route path="/admin/templates/new" element={<NotificationTemplateEditor />} />
          <Route path="/admin/templates/edit/:id" element={<NotificationTemplateEditor />} />
                  <Route path="/gifts" element={<Gifts />} />
                  <Route path="/gift-leaderboard" element={<GiftLeaderboard />} />
                  <Route path="/watch-history" element={<WatchHistory />} />
                  <Route path="/advertise" element={<Advertise />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/lovable-store" element={<LovableStore />} />
                  <Route path="/audio-player" element={<AudioPlayer />} />
                  <Route path="*" element={<NotFound />} />
                 </Routes>
              </main>
              <BottomNav />
            </div>
          </div>
        </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingScreen />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FlashSaleAlert />
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
