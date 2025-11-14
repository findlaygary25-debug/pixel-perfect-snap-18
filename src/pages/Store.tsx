import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStoreAndProducts();
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
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Store</h1>
      {loading && <p>Loading...</p>}
      {!loading && store && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Store Name</label>
                <Input
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Logo URL</label>
                <Input
                  value={store.logo_url ?? ""}
                  onChange={(e) => setStore({ ...store, logo_url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Contact Email</label>
                <Input
                  type="email"
                  value={store.email ?? ""}
                  onChange={(e) => setStore({ ...store, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  value={store.phone ?? ""}
                  onChange={(e) => setStore({ ...store, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={store.description ?? ""}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveStore}>Save Store</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Products ({products.length})</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title *</label>
                    <Input
                      value={productForm.title}
                      onChange={(e) =>
                        setProductForm({ ...productForm, title: e.target.value })
                      }
                      placeholder="Product title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      placeholder="Product description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Product Image</label>
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
                    {editingProduct?.image_url && !productForm.image && (
                      <img
                        src={editingProduct.image_url}
                        alt="Current product"
                        className="mt-2 w-32 h-32 object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProduct}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? "Saving..." : "Save Product"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                  <p className="font-bold mb-3">${p.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(p)}
                      className="flex-1"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
