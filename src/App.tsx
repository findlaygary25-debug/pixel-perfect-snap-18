import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { LoadingScreen } from "@/components/LoadingScreen";
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
import ScheduledVideos from "./pages/ScheduledVideos";
import Live from "./pages/Live";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LoadingScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:block" />
                  <img 
                    src="/voice2fire-logo.png" 
                    alt="Voice2Fire" 
                    className="h-10 w-auto object-contain hover-scale"
                  />
                </div>
                <NotificationBell />
              </header>
              <main className="flex-1 pb-28 md:pb-0">
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
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/shares" element={<Shares />} />
          <Route path="/import" element={<ImportVideos />} />
          <Route path="/scheduled" element={<ScheduledVideos />} />
          <Route path="/live" element={<Live />} />
          <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BottomNav />
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
