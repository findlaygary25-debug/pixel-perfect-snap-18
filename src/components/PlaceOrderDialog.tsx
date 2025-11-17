import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

const orderSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999"),
  customer_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  customer_email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  customer_phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Phone can only contain numbers, spaces, and basic formatting characters")
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must be less than 20 characters"),
  shipping_address: z
    .string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters"),
});

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
    
    // Validate all inputs
    const validation = orderSchema.safeParse({
      quantity,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid input";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

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

      // Get user's profile to find their referrer (affiliate)
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", user.id)
        .single();

      // Use validated and sanitized data
      const validatedData = validation.data;

      // Create order with encrypted PII using the secure function
      const { data: orderIdData, error: orderError } = await supabase.rpc(
        "create_order_with_encrypted_pii",
        {
          p_customer_id: user.id,
          p_store_id: product.store_id,
          p_total_amount: totalAmount,
          p_customer_name: validatedData.customer_name,
          p_customer_email: validatedData.customer_email,
          p_customer_phone: validatedData.customer_phone,
          p_shipping_address: validatedData.shipping_address,
          p_affiliate_id: profile?.referred_by || null,
        }
      );

      if (orderError) throw orderError;
      
      const orderId = orderIdData as string;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: product.id,
          quantity: validatedData.quantity,
          price_at_purchase: product.price,
        });

      if (itemError) throw itemError;

      // Calculate commissions for the affiliate chain
      try {
        await supabase.functions.invoke("calculate-commissions", {
          body: { orderId },
        });
      } catch (commissionError) {
        console.error("Commission calculation error:", commissionError);
        // Don't fail the order if commission calc fails
      }

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
