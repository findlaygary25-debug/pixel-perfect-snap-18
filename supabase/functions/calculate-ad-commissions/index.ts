import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMMISSION_RATES = {
  1: 0.10, // Tier 1: 10%
  2: 0.07, // Tier 2: 7%
  3: 0.05, // Tier 3: 5%
  4: 0.03, // Tier 4: 3%
  5: 0.02, // Tier 5: 2%
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { adId } = await req.json();

    if (!adId) {
      throw new Error('Missing adId parameter');
    }

    console.log('Calculating commissions for ad:', adId);

    // Get advertisement details
    const { data: ad, error: adError } = await supabase
      .from('advertisements')
      .select('advertiser_id, amount_spent, referred_by')
      .eq('id', adId)
      .single();

    if (adError) throw adError;
    if (!ad) throw new Error('Advertisement not found');

    console.log('Advertisement details:', ad);

    // Get affiliate chain for the advertiser
    const { data: affiliateChain, error: chainError } = await supabase
      .rpc('get_affiliate_chain', { start_user_id: ad.advertiser_id });

    if (chainError) throw chainError;
    if (!affiliateChain || affiliateChain.length === 0) {
      console.log('No affiliate chain found for advertiser');
      return new Response(
        JSON.stringify({ message: 'No affiliates to pay commissions to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Affiliate chain:', affiliateChain);

    const commissions = [];

    // Calculate and distribute commissions to each level
    for (const affiliate of affiliateChain) {
      const level = affiliate.level;
      
      // Only pay commissions for first 5 levels
      if (level > 5) break;

      const rate = COMMISSION_RATES[level as keyof typeof COMMISSION_RATES];
      if (!rate) continue;

      const commissionAmount = Math.floor(ad.amount_spent * rate);

      if (commissionAmount > 0) {
        console.log(`Processing commission for level ${level}:`, {
          affiliate_id: affiliate.user_id,
          amount: commissionAmount,
          rate: rate
        });

        // Insert commission record
        const { error: commissionError } = await supabase
          .from('ad_commissions')
          .insert({
            ad_id: adId,
            advertiser_id: ad.advertiser_id,
            affiliate_id: affiliate.user_id,
            amount: commissionAmount,
            commission_rate: rate,
            status: 'pending',
          });

        if (commissionError) {
          console.error('Error inserting commission:', commissionError);
          throw commissionError;
        }

        // Update affiliate wallet
        const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
          p_user_id: affiliate.user_id,
          p_amount: commissionAmount,
        });

        if (walletError) {
          console.error('Error updating wallet:', walletError);
          throw walletError;
        }

        // Mark commission as paid
        await supabase
          .from('ad_commissions')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('ad_id', adId)
          .eq('affiliate_id', affiliate.user_id);

        commissions.push({
          level,
          affiliate_id: affiliate.user_id,
          amount: commissionAmount,
          rate: rate,
        });
      }
    }

    console.log('Commissions calculated and paid:', commissions);

    return new Response(
      JSON.stringify({
        success: true,
        commissions,
        total_paid: commissions.reduce((sum, c) => sum + c.amount, 0),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating ad commissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
