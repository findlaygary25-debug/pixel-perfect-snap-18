import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import { Plus, Pencil, Trash2, Package, ShoppingCart, Truck, CheckSquare, Filter, X, Save, Calendar as CalendarIcon } from "lucide-react";
import { PlaceOrderDialog } from "@/components/PlaceOrderDialog";
import { format } from "date-fns";

type Store = {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProductFormData = {
  title: string;
  description: string;
  price: string;
  image: File | null;
};

type Order = {
  id: string;
  customer_id: string;
  store_id: string;
  status: "pending" | "processing" | "completed" | "cancelled";
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

type FilterPreset = {
  id: string;
  name: string;
  status: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  customerName: string;
};

type OrderFilters = {
  status: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  customerName: string;
};

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [filters, setFilters] = useState<OrderFilters>({
    status: [],
    dateFrom: null,
    dateTo: null,
    customerName: "",
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { performUndoableAction } = useUndoableAction();

  // Load filter presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem("orderFilterPresets");
    if (savedPresets) {
      try {
        const presets = JSON.parse(savedPresets);
        // Convert date strings back to Date objects
        const parsedPresets = presets.map((preset: any) => ({
          ...preset,
          dateFrom: preset.dateFrom ? new Date(preset.dateFrom) : null,
          dateTo: preset.dateTo ? new Date(preset.dateTo) : null,
        }));
        setFilterPresets(parsedPresets);
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  useEffect(() => {
    loadStoreAndProducts();
    loadOrders();
  }, []);

  useEffect(() => {
    // Set up realtime subscription for orders
    const channel = supabase
      .channel('store-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected in store:', payload);
          // Reload orders when changes occur
          loadOrders();
        }
      )
      .subscribe((status) => {
        console.log('Store orders subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStoreAndProducts = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: stores, error } = await supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (error) console.error(error);
    let s = stores?.[0] as Store | undefined;

    if (!s) {
      const { data, error: e2 } = await supabase
        .from("stores")
        .insert({ user_id: user.id, name: "My Voice2Fire Store" })
        .select()
        .single();
      if (e2) console.error(e2);
      s = data as Store;
    }
    setStore(s!);

    const { data: prods, error: e3 } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", s!.id)
      .order("created_at", { ascending: false });

    if (e3) console.error(e3);
    setProducts(prods ?? []);
    setLoading(false);
  };

  const loadOrders = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id);

    if (!stores || stores.length === 0) return;

    const storeId = stores[0].id;

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
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
  };

  const sendOrderNotification = async (order: Order, items: OrderItem[]) => {
    try {
      const { error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          orderId: order.id,
          status: order.status,
          trackingNumber: order.tracking_number,
          orderTotal: order.total_amount,
          items: items.map((item) => ({
            title: item.products.title,
            quantity: item.quantity,
            price: item.price_at_purchase,
          })),
        },
      });

      if (error) {
        console.error("Failed to send email:", error);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "processing" | "completed" | "cancelled") => {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return;

    const originalOrder = orders[orderIndex];
    const previousStatus = originalOrder.status;
    const optimisticOrders = [...orders];
    
    // Apply optimistic update
    const updateData: any = { status: newStatus };
    if (newStatus === "completed") {
      updateData.delivered_at = new Date().toISOString();
    }
    
    optimisticOrders[orderIndex] = { ...originalOrder, ...updateData };
    setOrders(optimisticOrders);
    setUpdatingOrderId(orderId);

    try {
      await performUndoableAction(
        async () => {
          const { error } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", orderId);

          if (error) throw error;

          // Send email notification
          const order = optimisticOrders[orderIndex];
          const items = orderItems[orderId] || [];
          await sendOrderNotification(order, items);
          
          // Reload to ensure sync
          loadOrders();
        },
        async () => {
          // Undo action: revert to previous status
          const revertData: any = { status: previousStatus };
          if (previousStatus !== "completed") {
            revertData.delivered_at = null;
          }
          
          const { error } = await supabase
            .from("orders")
            .update(revertData)
            .eq("id", orderId);

          if (error) throw error;
          loadOrders();
        },
        {
          successMessage: `Order status updated to ${newStatus}`,
          undoMessage: `Order status reverted to ${previousStatus}`,
          errorMessage: "Failed to update order status",
        }
      );
    } catch (error: any) {
      // Rollback on error
      setOrders(orders);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.size === 0 || !bulkStatus) return;

    const selectedOrders = orders.filter((o) => selectedOrderIds.has(o.id));
    const orderUpdates = selectedOrders.map((order) => ({
      orderId: order.id,
      previousStatus: order.status,
      newStatus: bulkStatus as any,
    }));

    setUpdatingOrderId("bulk");
    const currentOrders = [...orders];
    const optimisticOrders = orders.map((order) =>
      selectedOrderIds.has(order.id)
        ? {
            ...order,
            status: bulkStatus as any,
            delivered_at: bulkStatus === "completed" ? new Date().toISOString() : order.delivered_at,
          }
        : order
    );
    setOrders(optimisticOrders);

    try {
      await performUndoableAction(
        async () => {
          // Update all selected orders
          for (const update of orderUpdates) {
            const updateData: any = { status: update.newStatus };
            if (update.newStatus === "completed") {
              updateData.delivered_at = new Date().toISOString();
            }
            
            const { error } = await supabase
              .from("orders")
              .update(updateData)
              .eq("id", update.orderId);

            if (error) throw error;
          }

          // Send notifications for all updated orders
          for (const update of orderUpdates) {
            const order = optimisticOrders.find((o) => o.id === update.orderId);
            if (order) {
              const items = orderItems[update.orderId] || [];
              await sendOrderNotification(order, items);
            }
          }

          loadOrders();
        },
        async () => {
          // Undo action: revert all statuses
          for (const update of orderUpdates) {
            const revertData: any = { status: update.previousStatus };
            if (update.previousStatus !== "completed") {
              revertData.delivered_at = null;
            }

            const { error } = await supabase
              .from("orders")
              .update(revertData)
              .eq("id", update.orderId);

            if (error) throw error;
          }
          loadOrders();
        },
        {
          successMessage: `${selectedOrderIds.size} order(s) updated to ${bulkStatus}`,
          undoMessage: `Bulk update reverted`,
          errorMessage: "Failed to update orders",
        }
      );

      setSelectedOrderIds(new Set());
      setBulkStatus("");
    } catch (error: any) {
      setOrders(currentOrders);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrderIds);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrderIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(order.status)) {
      return false;
    }

    // Filter by date range
    if (filters.dateFrom) {
      const orderDate = new Date(order.created_at);
      if (orderDate < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      const orderDate = new Date(order.created_at);
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (orderDate > endOfDay) return false;
    }

    // Filter by customer name
    if (filters.customerName.trim()) {
      const searchTerm = filters.customerName.toLowerCase();
      return order.customer_name.toLowerCase().includes(searchTerm) ||
             order.customer_email.toLowerCase().includes(searchTerm);
    }

    return true;
  });

  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      dateFrom: null,
      dateTo: null,
      customerName: "",
    });
  };

  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.customerName.trim() !== "";

  const saveFilterPreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      ...filters,
    };

    const updatedPresets = [...filterPresets, newPreset];
    setFilterPresets(updatedPresets);
    localStorage.setItem("orderFilterPresets", JSON.stringify(updatedPresets));

    toast({
      title: "Success",
      description: "Filter preset saved",
    });

    setPresetName("");
    setSavePresetDialogOpen(false);
  };

  const loadFilterPreset = (preset: FilterPreset) => {
    setFilters({
      status: preset.status,
      dateFrom: preset.dateFrom,
      dateTo: preset.dateTo,
      customerName: preset.customerName,
    });
  };

  const deleteFilterPreset = (presetId: string) => {
    const updatedPresets = filterPresets.filter((p) => p.id !== presetId);
    setFilterPresets(updatedPresets);
    localStorage.setItem("orderFilterPresets", JSON.stringify(updatedPresets));

    toast({
      title: "Success",
      description: "Preset deleted",
    });
  };

  const addTrackingNumber = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }

    const orderIndex = orders.findIndex((o) => o.id === selectedOrder.id);
    if (orderIndex === -1) return;

    const originalOrders = [...orders];
    const previousTrackingNumber = selectedOrder.tracking_number;
    const previousStatus = selectedOrder.status;
    const optimisticOrders = [...orders];
    
    // Apply optimistic update
    optimisticOrders[orderIndex] = {
      ...selectedOrder,
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
      status: "processing",
    };
    setOrders(optimisticOrders);
    setUpdatingOrderId(selectedOrder.id);

    // Close dialog immediately
    const trackingValue = trackingNumber;
    const orderId = selectedOrder.id;
    setTrackingDialogOpen(false);
    setTrackingNumber("");
    setSelectedOrder(null);

    try {
      await performUndoableAction(
        async () => {
          const { error } = await supabase
            .from("orders")
            .update({
              tracking_number: trackingValue,
              shipped_at: new Date().toISOString(),
              status: "processing",
            })
            .eq("id", orderId);

          if (error) throw error;

          // Send email notification
          const items = orderItems[orderId] || [];
          await sendOrderNotification(
            optimisticOrders[orderIndex],
            items
          );

          loadOrders();
        },
        async () => {
          // Undo action: revert tracking number and status
          const { error } = await supabase
            .from("orders")
            .update({
              tracking_number: previousTrackingNumber,
              shipped_at: null,
              status: previousStatus,
            })
            .eq("id", orderId);

          if (error) throw error;
          loadOrders();
        },
        {
          successMessage: "Tracking number added and customer notified",
          undoMessage: "Tracking number change reverted",
          errorMessage: "Failed to add tracking number",
        }
      );
    } catch (error: any) {
      // Rollback on error
      setOrders(originalOrders);
    } finally {
      setUpdatingOrderId(null);
    }
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

  const saveStore = async () => {
    if (!store) return;
    const { error } = await supabase
      .from("stores")
      .update({
        name: store.name,
        logo_url: store.logo_url,
        email: store.email,
        phone: store.phone,
        description: store.description,
      })
      .eq("id", store.id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Store settings saved successfully",
      });
    }
  };

  const uploadProductImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSaveProduct = async () => {
    if (!store || !productForm.title || !productForm.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingProduct?.image_url || null;

      if (productForm.image) {
        imageUrl = await uploadProductImage(productForm.image);
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }
      }

      const productData = {
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: imageUrl,
        store_id: store.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Product added successfully",
        });
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ title: "", description: "", price: "", image: null });
      loadStoreAndProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveProduct();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      image: null,
    });
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadStoreAndProducts();
    }
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ title: "", description: "", price: "", image: null });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Store Management</h1>
      
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Store Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Products</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddNewProduct}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={productForm.title}
                          onChange={(e) =>
                            setProductForm({ ...productForm, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({ ...productForm, description: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({ ...productForm, price: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Product Image</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              image: e.target.files?.[0] || null,
                            })
                          }
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={uploading}>
                        {uploading
                          ? "Saving..."
                          : editingProduct
                          ? "Update Product"
                          : "Add Product"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No products yet. Add your first product!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id}>
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.description}
                        </p>
                        <p className="text-lg font-bold mb-3">${product.price}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="ml-auto"
                            onClick={() => {
                              setSelectedProduct(product);
                              setOrderDialogOpen(true);
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Order
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders {filteredOrders.length !== orders.length && (
                    <Badge variant="secondary">
                      {filteredOrders.length} of {orders.length}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {orders.length > 0 && (
                    <>
                      <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                            {filters.status.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + (filters.customerName ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {selectedOrderIds.size === filteredOrders.length ? "Deselect All" : "Select All"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {showFilters && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filter Orders</h4>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                      {hasActiveFilters && (
                        <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Save Preset
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Save Filter Preset</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Preset Name</label>
                                <Input
                                  value={presetName}
                                  onChange={(e) => setPresetName(e.target.value)}
                                  placeholder="e.g., Pending Orders This Week"
                                />
                              </div>
                              <Button onClick={saveFilterPreset} className="w-full">
                                Save Preset
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <div className="space-y-2">
                        {["pending", "processing", "completed", "cancelled"].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onCheckedChange={() => toggleStatusFilter(status)}
                            />
                            <label
                              htmlFor={`status-${status}`}
                              className="text-sm capitalize cursor-pointer"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date From</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateFrom || undefined}
                            onSelect={(date) => setFilters({ ...filters, dateFrom: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date To</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.dateTo || undefined}
                            onSelect={(date) => setFilters({ ...filters, dateTo: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Search</label>
                      <Input
                        placeholder="Name or email..."
                        value={filters.customerName}
                        onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  {filterPresets.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Saved Presets</label>
                      <div className="flex flex-wrap gap-2">
                        {filterPresets.map((preset) => (
                          <div key={preset.id} className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadFilterPreset(preset)}
                            >
                              {preset.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => deleteFilterPreset(preset.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedOrderIds.size > 0 && (
                <div className="mb-4 p-4 bg-muted rounded-lg flex items-center gap-4">
                  <Badge variant="secondary">{selectedOrderIds.size} selected</Badge>
                  <div className="flex items-center gap-2 flex-1">
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Update status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkStatusUpdate}
                      disabled={!bulkStatus || updatingOrderId === "bulk"}
                    >
                      {updatingOrderId === "bulk" ? "Updating..." : "Apply"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrderIds(new Set());
                        setBulkStatus("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              {filteredOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {hasActiveFilters ? "No orders match the current filters" : "No orders yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className={selectedOrderIds.has(order.id) ? "ring-2 ring-primary" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedOrderIds.has(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                              className="mt-1"
                            />
                            <div>
                              <CardTitle className="text-lg">
                                Order #{order.id.slice(0, 8)}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value as any)}
                            disabled={updatingOrderId === order.id}
                          >
                            <SelectTrigger className={`w-36 ${updatingOrderId === order.id ? 'opacity-50' : ''}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Items:</h4>
                            <div className="space-y-2">
                              {orderItems[order.id]?.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-2 bg-muted rounded"
                                >
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <h4 className="font-medium mb-1">Customer:</h4>
                              <p className="text-sm">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.customer_email}
                              </p>
                              {order.customer_phone && (
                                <p className="text-sm text-muted-foreground">
                                  {order.customer_phone}
                                </p>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Shipping Address:</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {order.shipping_address}
                              </p>
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
                            </div>
                          )}

                          {!order.tracking_number && order.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              disabled={updatingOrderId === order.id}
                              onClick={() => {
                                setSelectedOrder(order);
                                setTrackingDialogOpen(true);
                              }}
                            >
                              <Truck className="mr-2 h-4 w-4" />
                              {updatingOrderId === order.id ? 'Updating...' : 'Add Tracking Number'}
                            </Button>
                          )}

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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Store Name</label>
                <Input
                  value={store?.name || ""}
                  onChange={(e) => store && setStore({ ...store, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Logo URL</label>
                <Input
                  value={store?.logo_url ?? ""}
                  onChange={(e) => store && setStore({ ...store, logo_url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Contact Email</label>
                <Input
                  type="email"
                  value={store?.email ?? ""}
                  onChange={(e) => store && setStore({ ...store, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  value={store?.phone ?? ""}
                  onChange={(e) => store && setStore({ ...store, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={store?.description ?? ""}
                  onChange={(e) => store && setStore({ ...store, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveStore}>Save Store</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedProduct && (
        <PlaceOrderDialog
          product={selectedProduct}
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          onOrderCreated={() => {
            loadStoreAndProducts();
            loadOrders();
          }}
        />
      )}

      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tracking Number</label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Adding a tracking number will automatically update the order status to "Processing" and send an email notification to the customer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTrackingNumber}>
              Add Tracking & Notify Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
