import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { AdminNotificationCenter } from "./AdminNotificationCenter";

export function AdminNotificationBell() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadNotificationCount();
      const interval = setInterval(loadNotificationCount, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
    } catch (error) {
      console.error("Error in admin check:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      // Count pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count flash sales ending in next 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: endingSales } = await supabase
        .from('reward_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_on_sale', true)
        .lte('sale_end_date', tomorrow.toISOString())
        .gt('sale_end_date', new Date().toISOString());

      const total = (pendingOrders || 0) + (endingSales || 0);
      setNotificationCount(total);
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </Badge>
        )}
      </Button>

      <AdminNotificationCenter open={open} onOpenChange={setOpen} />
    </>
  );
}
