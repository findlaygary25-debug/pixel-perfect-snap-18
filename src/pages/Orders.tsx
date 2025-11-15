import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck } from "lucide-react";

type Order = {
  id: string;
  store_id: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    title: string;
    image_url: string | null;
  };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    // Set up realtime subscription for orders
    const channel = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected for customer:', payload);
          // Reload orders when changes occur
          loadOrders();
        }
      )
      .subscribe((status) => {
        console.log('Customer orders subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOrders(ordersData || []);

    // Load order items for each order
    const itemsMap: Record<string, OrderItem[]> = {};
    for (const order of ordersData || []) {
      const { data: items } = await supabase
        .from("order_items")
        .select("*, products(title, image_url)")
        .eq("order_id", order.id);

      if (items) {
        itemsMap[order.id] = items as any;
      }
    }
    setOrderItems(itemsMap);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-6 w-6" />
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Items:</h4>
                    <div className="space-y-2">
                      {orderItems[order.id]?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                          {item.products.image_url && (
                            <img
                              src={item.products.image_url}
                              alt={item.products.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.products.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ${item.price_at_purchase}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.tracking_number && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Tracking Information</h4>
                      </div>
                      <p className="text-lg font-mono font-bold text-blue-700">
                        {order.tracking_number}
                      </p>
                      {order.shipped_at && (
                        <p className="text-sm text-blue-600 mt-1">
                          Shipped: {new Date(order.shipped_at).toLocaleDateString()}
                        </p>
                      )}
                      {order.delivered_at && (
                        <p className="text-sm text-green-600 mt-1">
                          Delivered: {new Date(order.delivered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-1">Shipping Address:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {order.shipping_address}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Contact:</h4>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold">${order.total_amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
