import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Package, ShoppingCart } from "lucide-react";

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

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
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

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: true });

    setOrders(ordersData || []);

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

  // Order trends by day
  const orderTrends = orders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.orders += 1;
      existing.revenue += Number(order.total_amount);
    } else {
      acc.push({
        date,
        orders: 1,
        revenue: Number(order.total_amount),
      });
    }
    return acc;
  }, [] as { date: string; orders: number; revenue: number }[]);

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your store's performance and trends</p>
        </div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} completed
            </p>
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
        {/* Order Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Order Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {orderTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={orderTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#8b5cf6" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {orderTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={orderTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Products by Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Revenue by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: $${entry.revenue.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
