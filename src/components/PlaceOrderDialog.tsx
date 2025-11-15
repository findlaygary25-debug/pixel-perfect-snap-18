import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

type Product = {
  id: string;
  store_id: string;
  title: string;
  price: number;
};

type PlaceOrderDialogProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: () => void;
};

export function PlaceOrderDialog({ product, open, onOpenChange, onOrderCreated }: PlaceOrderDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const totalAmount = product.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to place an order",
          variant: "destructive",
        });
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          store_id: product.store_id,
          total_amount: totalAmount,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity,
          price_at_purchase: product.price,
        });

      if (itemError) throw itemError;

      toast({
        title: "Success",
        description: "Order placed successfully!",
      });

      // Notify parent component
      onOrderCreated?.();
      
      onOpenChange(false);
      setQuantity(1);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
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
      <DialogContent className="max-w-md">
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
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1234567890"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Shipping Address</label>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              required
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Price per item:</span>
              <span>${product.price}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {submitting ? "Placing Order..." : "Place Order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
