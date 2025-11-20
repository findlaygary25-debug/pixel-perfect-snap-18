import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import coinImage from "@/assets/voice2fire-coin.png";

type Product = {
  id: string;
  store_id: string;
  title: string;
  price_in_coins: number;
  payment_method: string;
};

type PlaceOrderDialogCoinsProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
};

export function PlaceOrderDialogCoins({ product, open, onOpenChange, onOrderCreated }: PlaceOrderDialogCoinsProps) {
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const totalCoins = product.price_in_coins * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!wallet || wallet.balance < totalCoins) {
        toast({
          title: "Insufficient coins",
          description: `You need ${totalCoins} coins. Current balance: ${wallet?.balance || 0} coins.`,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Deduct coins
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - totalCoins })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          store_id: product.store_id,
          customer_name: profile?.username || "Customer",
          customer_email: user.email || "",
          shipping_address: shippingAddress,
          total_amount: totalCoins,
          payment_method: "coins",
          coins_paid: totalCoins,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity,
          price_at_purchase: product.price_in_coins,
        });

      if (itemError) throw itemError;

      toast({
        title: "Order placed",
        description: `Successfully ordered ${quantity}x ${product.title} for ${totalCoins} coins!`,
      });

      onOpenChange(false);
      onOrderCreated();
      setQuantity(1);
      setShippingAddress("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Order - {product.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Shipping Address</label>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter your shipping address"
              rows={3}
              required
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Price per item:</span>
              <div className="flex items-center gap-1">
                <img src={coinImage} alt="coin" className="h-4 w-4" />
                <span className="font-medium">{product.price_in_coins}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Quantity:</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-bold">Total:</span>
              <div className="flex items-center gap-1">
                <img src={coinImage} alt="coin" className="h-5 w-5" />
                <span className="text-lg font-bold">{totalCoins}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Processing..." : "Place Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
