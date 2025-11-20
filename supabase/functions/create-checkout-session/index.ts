import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Coin packages configuration
const COIN_PACKAGES: Record<string, { coins: number; bonus: number; price: number }> = {
  'starter': { coins: 100, bonus: 0, price: 0.99 },
  'popular': { coins: 500, bonus: 50, price: 4.99 },
  'best-value': { coins: 1200, bonus: 200, price: 9.99 },
  'mega': { coins: 2500, bonus: 500, price: 19.99 },
  'ultimate': { coins: 6500, bonus: 1500, price: 49.99 },
  'legendary': { coins: 13000, bonus: 3500, price: 99.99 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { packageId } = await req.json();

    // Validate package ID
    const packageData = COIN_PACKAGES[packageId];
    if (!packageData) {
      return new Response(
        JSON.stringify({ error: 'Invalid package ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageData.coins + packageData.bonus} Coins`,
              description: packageData.bonus > 0 
                ? `${packageData.coins} coins + ${packageData.bonus} bonus coins` 
                : `${packageData.coins} coins`,
            },
            unit_amount: Math.round(packageData.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/wallet?success=true`,
      cancel_url: `${req.headers.get('origin')}/wallet?canceled=true`,
      metadata: {
        user_id: user.id,
        package_id: packageId,
        coins: packageData.coins.toString(),
        bonus_coins: packageData.bonus.toString(),
        total_coins: (packageData.coins + packageData.bonus).toString(),
      },
    });

    console.log(`Checkout session created for user ${user.id}: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
