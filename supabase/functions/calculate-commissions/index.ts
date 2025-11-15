import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Commission rates for each level (can be configured)
const COMMISSION_RATES = {
  1: 10, // Level 1 (direct referral): 10%
  2: 5,  // Level 2: 5%
  3: 3,  // Level 3: 3%
  4: 2,  // Level 4: 2%
  5: 1,  // Level 5: 1%
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, total_amount, affiliate_id")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found");

    // If no affiliate, nothing to do
    if (!order.affiliate_id) {
      return new Response(
        JSON.stringify({ message: "No affiliate to credit", commissionsCreated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the affiliate chain (up to 5 levels)
    const { data: affiliateChain, error: chainError } = await supabase
      .rpc("get_affiliate_chain", { user_id: order.customer_id });

    if (chainError) throw chainError;

    if (!affiliateChain || affiliateChain.length === 0) {
      return new Response(
        JSON.stringify({ message: "No affiliate chain found", commissionsCreated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate and create commissions for each level
    const commissions = [];
    for (const affiliate of affiliateChain) {
      const rate = COMMISSION_RATES[affiliate.level as keyof typeof COMMISSION_RATES] || 0;
      const amount = (Number(order.total_amount) * rate) / 100;

      commissions.push({
        affiliate_id: affiliate.affiliate_id,
        order_id: order.id,
        customer_id: order.customer_id,
        level: affiliate.level,
        amount: amount,
        commission_rate: rate,
        status: "pending",
      });
    }

    // Insert all commissions
    const { data: createdCommissions, error: commissionError } = await supabase
      .from("commissions")
      .insert(commissions)
      .select();

    if (commissionError) {
      console.error("Commission creation error:", commissionError);
      throw commissionError;
    }

    // Update affiliate wallets with pending commissions
    for (const commission of commissions) {
      const { error: walletError } = await supabase.rpc(
        "increment_wallet_balance",
        {
          user_id: commission.affiliate_id,
          amount: commission.amount,
        }
      );

      if (walletError) {
        console.error("Wallet update error:", walletError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Commissions calculated successfully",
        commissionsCreated: createdCommissions?.length || 0,
        totalCommissionAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
