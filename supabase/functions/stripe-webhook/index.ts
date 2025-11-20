import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signature verification failed';
      console.error('Webhook signature verification failed:', errorMessage);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event received:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata?.user_id || !metadata?.total_coins) {
        console.error('Missing metadata in session');
        return new Response(
          JSON.stringify({ error: 'Missing metadata' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Initialize Supabase with service role
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Create transaction record
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: metadata.user_id,
          package_id: metadata.package_id,
          coins_purchased: parseInt(metadata.coins),
          bonus_coins: parseInt(metadata.bonus_coins),
          total_coins: parseInt(metadata.total_coins),
          amount_paid: session.amount_total! / 100, // Convert from cents
          currency: session.currency || 'usd',
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_payment_status: session.payment_status,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (txError) {
        console.error('Error creating transaction:', txError);
        throw txError;
      }

      // Update user's wallet balance
      const { data: currentWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', metadata.user_id)
        .single();

      const newBalance = (currentWallet?.balance || 0) + parseInt(metadata.total_coins);

      const { error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: metadata.user_id,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        });

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        throw walletError;
      }

      console.log(`Successfully credited ${metadata.total_coins} coins to user ${metadata.user_id}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
