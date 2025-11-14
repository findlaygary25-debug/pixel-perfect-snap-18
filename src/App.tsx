import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Upload from "./pages/Upload";
import Store from "./pages/Store";
import Wallet from "./pages/Wallet";
import Affiliate from "./pages/Affiliate";
import Makeup from "./pages/Makeup";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center justify-between border-b bg-background px-4">
                <div className="flex items-center">
                  <SidebarTrigger />
                  <h1 className="ml-4 font-bold text-lg">🔥 Voice2Fire</h1>
                </div>
                <NotificationBell />
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/affiliate" element={<Affiliate />} />
                  <Route path="/makeup" element={<Makeup />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
