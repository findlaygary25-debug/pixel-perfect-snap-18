import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setLoading(false);
        return;
      }
      // get or create store for owner
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
        .eq("is_active", true)
        .limit(12);

      if (e3) console.error(e3);
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, []);

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
    if (error) alert("Save failed: " + error.message);
    else alert("Saved ✅");
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
                <label className="text-sm font-medium mb-2 block">Contact Phone</label>
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

          <h2 className="text-xl font-bold mb-4">Products ({products.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover rounded mb-2" />
                  )}
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                  <p className="font-bold">${p.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
