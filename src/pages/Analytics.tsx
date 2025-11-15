import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Wifi, ArrowUp, ArrowDown } from "lucide-react";

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
};

type OrderItem = {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    title: string;
  };
};

type DateRange = "7days" | "30days" | "90days" | "365days";

type TimeGrouping = "day" | "week" | "month";

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>("day");
  const [loading, setLoading] = useState(true);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [previousPeriodOrders, setPreviousPeriodOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  useEffect(() => {
    // Set up realtime subscription for orders
    const channel = supabase
      .channel('analytics-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          // Reload analytics data when orders change
          loadAnalyticsData();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsRealTimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsRealTimeConnected(false);
    };
  }, [dateRange]);

  const getDateRangeStart = (range: DateRange): Date => {
    const now = new Date();
    switch (range) {
      case "7days":
        return new Date(now.setDate(now.getDate() - 7));
      case "30days":
        return new Date(now.setDate(now.getDate() - 30));
      case "90days":
        return new Date(now.setDate(now.getDate() - 90));
      case "365days":
        return new Date(now.setDate(now.getDate() - 365));
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id);

    if (!stores || stores.length === 0) {
      setLoading(false);
      return;
    }

    const storeId = stores[0].id;
    const startDate = getDateRangeStart(dateRange).toISOString();
    
    // Get previous period for comparison
    const daysDiff = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(new Date(startDate).getTime() - (daysDiff * 24 * 60 * 60 * 1000)).toISOString();

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: true });

    const { data: previousOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", previousStartDate)
      .lt("created_at", startDate)
      .order("created_at", { ascending: true });

    setOrders(ordersData || []);
    setPreviousPeriodOrders(previousOrders || []);

    // Get all order items for the orders
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map((o) => o.id);
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*, products(title)")
        .in("order_id", orderIds);

      setOrderItems((itemsData as any) || []);
    }

    setLoading(false);
  };

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Previous period metrics for comparison
  const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const previousOrders = previousPeriodOrders.length;
  
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const ordersGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

  // Group orders by time period
  const groupByTime = (orders: Order[]) => {
    return orders.reduce((acc, order) => {
      const date = new Date(order.created_at);
      let key: string;
      
      if (timeGrouping === "day") {
        key = date.toLocaleDateString();
      } else if (timeGrouping === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toLocaleDateString();
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const existing = acc.find((item) => item.date === key);
      if (existing) {
        existing.orders += 1;
        existing.revenue += Number(order.total_amount);
      } else {
        acc.push({
          date: key,
          orders: 1,
          revenue: Number(order.total_amount),
        });
      }
      return acc;
    }, [] as { date: string; orders: number; revenue: number }[]);
  };

  const orderTrends = groupByTime(orders);

  // Revenue by status
  const revenueByStatus = orders.reduce((acc, order) => {
    const existing = acc.find((item) => item.status === order.status);
    const amount = Number(order.total_amount);
    if (existing) {
      existing.revenue += amount;
    } else {
      acc.push({
        status: order.status,
        revenue: amount,
      });
    }
    return acc;
  }, [] as { status: string; revenue: number }[]);

  // Popular products
  const productSales = orderItems.reduce((acc, item) => {
    const existing = acc.find((p) => p.name === item.products.title);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += Number(item.price_at_purchase) * item.quantity;
    } else {
      acc.push({
        name: item.products.title,
        quantity: item.quantity,
        revenue: Number(item.price_at_purchase) * item.quantity,
      });
    }
    return acc;
  }, [] as { name: string; quantity: number; revenue: number }[]);

  const topProducts = productSales.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const topProductsByRevenue = productSales.sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <Badge 
              variant={isRealTimeConnected ? "default" : "secondary"} 
              className={`flex items-center gap-1 ${isRealTimeConnected ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              <Wifi className="h-3 w-3" />
              {isRealTimeConnected ? 'Live' : 'Connecting...'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isRealTimeConnected 
              ? 'Dashboard updates automatically when new orders arrive' 
              : 'Track your store\'s performance and trends'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeGrouping} onValueChange={(value) => setTimeGrouping(value as TimeGrouping)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="365days">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {revenueGrowth >= 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{revenueGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{revenueGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {ordersGrowth >= 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{ordersGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{ordersGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Combined Order & Revenue Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order & Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {orderTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={orderTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Tabs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Products Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="units" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="units">By Units Sold</TabsTrigger>
              <TabsTrigger value="revenue">By Revenue</TabsTrigger>
            </TabsList>
            <TabsContent value="units" className="mt-4">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#6366f1" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </TabsContent>
            <TabsContent value="revenue" className="mt-4">
              {topProductsByRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsByRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revenue by Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Distribution by Order Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {revenueByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={revenueByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: $${entry.revenue.toFixed(0)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
