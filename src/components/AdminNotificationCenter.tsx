import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Zap,
  CheckCircle,
  Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AdminNotification {
  id: string;
  type: 'alert' | 'approval' | 'event';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  read: boolean;
}

interface AdminNotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminNotificationCenter({ open, onOpenChange }: AdminNotificationCenterProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    newUsers: 0,
    endingSales: 0
  });

  useEffect(() => {
    loadNotifications();
    subscribeToRealtimeUpdates();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notifications: AdminNotification[] = [];

      // Fetch pending orders
      const { data: pendingOrders, count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingOrders && pendingOrders.length > 0) {
        pendingOrders.forEach(order => {
          notifications.push({
            id: `order-${order.id}`,
            type: 'approval',
            priority: 'high',
            title: 'Pending Order',
            description: `Order #${order.id.slice(0, 8)} awaiting processing - $${order.total_amount}`,
            timestamp: order.created_at,
            actionUrl: '/orders',
            read: false
          });
        });
      }

      // Fetch recent users (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: newUsers, count: newUserCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (newUsers && newUsers.length > 0) {
        newUsers.forEach(user => {
          notifications.push({
            id: `user-${user.id}`,
            type: 'event',
            priority: 'low',
            title: 'New User Registered',
            description: `${user.username} joined the platform`,
            timestamp: user.created_at,
            actionUrl: '/admin',
            read: false
          });
        });
      }

      // Fetch ending flash sales (next 24 hours)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: endingSales, count: endingSalesCount } = await supabase
        .from('reward_items')
        .select('*', { count: 'exact' })
        .eq('is_on_sale', true)
        .lte('sale_end_date', tomorrow.toISOString())
        .gt('sale_end_date', new Date().toISOString())
        .order('sale_end_date', { ascending: true })
        .limit(5);

      if (endingSales && endingSales.length > 0) {
        endingSales.forEach(item => {
          notifications.push({
            id: `sale-${item.id}`,
            type: 'alert',
            priority: 'medium',
            title: 'Flash Sale Ending Soon',
            description: `"${item.item_name}" sale ends ${formatDistanceToNow(new Date(item.sale_end_date), { addSuffix: true })}`,
            timestamp: item.sale_end_date,
            actionUrl: '/admin/flash-sales',
            read: false
          });
        });
      }

      // Sort by timestamp (most recent first)
      notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(notifications);
      setStats({
        pendingOrders: pendingCount || 0,
        newUsers: newUserCount || 0,
        endingSales: endingSalesCount || 0
      });
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtimeUpdates = () => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const order = payload.new as any;
          const newNotification: AdminNotification = {
            id: `order-${order.id}`,
            type: 'approval',
            priority: 'high',
            title: 'New Order Received',
            description: `Order #${order.id.slice(0, 8)} - $${order.total_amount}`,
            timestamp: order.created_at,
            actionUrl: '/orders',
            read: false
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders + 1 }));
          toast.info("New order received", {
            description: newNotification.description
          });
        }
      )
      .subscribe();

    // Subscribe to new users
    const usersChannel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const user = payload.new as any;
          const newNotification: AdminNotification = {
            id: `user-${user.id}`,
            type: 'event',
            priority: 'low',
            title: 'New User Registered',
            description: `${user.username} joined the platform`,
            timestamp: user.created_at,
            actionUrl: '/admin',
            read: false
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setStats(prev => ({ ...prev, newUsers: prev.newUsers + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(usersChannel);
    };
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'approval':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-green-500" />;
    }
  };

  const filterByType = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            System alerts, pending approvals, and important events
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-muted text-center">
              <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.newUsers}</div>
              <div className="text-xs text-muted-foreground">New Users</div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.endingSales}</div>
              <div className="text-xs text-muted-foreground">Ending</div>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}

          {/* Notifications Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="alert">Alerts</TabsTrigger>
              <TabsTrigger value="approval">Approvals</TabsTrigger>
              <TabsTrigger value="event">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <NotificationList
                notifications={filterByType('all')}
                loading={loading}
                onMarkAsRead={markAsRead}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>

            <TabsContent value="alert" className="mt-4">
              <NotificationList
                notifications={filterByType('alert')}
                loading={loading}
                onMarkAsRead={markAsRead}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>

            <TabsContent value="approval" className="mt-4">
              <NotificationList
                notifications={filterByType('approval')}
                loading={loading}
                onMarkAsRead={markAsRead}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>

            <TabsContent value="event" className="mt-4">
              <NotificationList
                notifications={filterByType('event')}
                loading={loading}
                onMarkAsRead={markAsRead}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface NotificationListProps {
  notifications: AdminNotification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  getPriorityIcon: (priority: string) => JSX.Element;
  getTypeIcon: (type: string) => JSX.Element;
}

function NotificationList({ 
  notifications, 
  loading, 
  onMarkAsRead, 
  getPriorityIcon, 
  getTypeIcon 
}: NotificationListProps) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No notifications</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
              notification.read ? 'opacity-60' : 'bg-muted/30'
            }`}
            onClick={() => onMarkAsRead(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getTypeIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {notification.title}
                  </span>
                  {getPriorityIcon(notification.priority)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.description}
                </p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </span>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
