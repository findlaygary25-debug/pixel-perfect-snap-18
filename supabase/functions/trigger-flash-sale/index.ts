import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlashSaleConfig {
  duration_hours: number;
  discount_percentage: number;
  item_count: number;
  item_tiers: string[];
  banner_title: string;
  banner_subtitle: string;
  banner_description: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting flash sale trigger...');

    // Default flash sale configuration
    const defaultConfig: FlashSaleConfig = {
      duration_hours: 1,
      discount_percentage: 70,
      item_count: 3,
      item_tiers: ['gold', 'platinum'],
      banner_title: '⚡ FLASH SALE',
      banner_subtitle: '70% OFF',
      banner_description: 'Lightning deal! Grab premium items at massive discounts. Hurry - limited time only!',
    };

    // Allow custom configuration from request body
    const config: FlashSaleConfig = req.method === 'POST' 
      ? { ...defaultConfig, ...(await req.json().catch(() => ({}))) }
      : defaultConfig;

    console.log('Flash sale config:', config);

    // Calculate end time
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + config.duration_hours * 60 * 60 * 1000);

    // 1. Create flash sale promotional banner
    const { data: banner, error: bannerError } = await supabase
      .from('promotional_banners')
      .insert({
        title: config.banner_title,
        subtitle: config.banner_subtitle,
        description: config.banner_description,
        banner_type: 'flash_sale',
        background_gradient: 'from-red-500 via-orange-500 to-yellow-500',
        icon_name: 'Zap',
        cta_text: 'Shop Flash Sale',
        cta_link: '/rewards-store',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        display_order: 1,
        is_active: true,
      })
      .select()
      .single();

    if (bannerError) {
      console.error('Error creating banner:', bannerError);
      throw bannerError;
    }

    console.log('Created flash sale banner:', banner.id);

    // 2. Get eligible items for flash sale
    const { data: eligibleItems, error: itemsError } = await supabase
      .from('reward_items')
      .select('id, point_cost, original_price')
      .in('tier', config.item_tiers)
      .in('item_type', ['badge', 'cosmetic'])
      .eq('is_available', true)
      .or('is_on_sale.is.null,is_on_sale.eq.false')
      .limit(config.item_count);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }

    console.log(`Found ${eligibleItems?.length || 0} eligible items`);

    // 3. Update items with flash sale pricing
    let itemsUpdatedCount = 0;
    if (eligibleItems && eligibleItems.length > 0) {
      // Update each item individually to properly calculate prices
      for (const item of eligibleItems) {
        const originalPrice = item.original_price || item.point_cost;
        const salePrice = Math.floor(originalPrice * ((100 - config.discount_percentage) / 100));

        const { error: updateError } = await supabase
          .from('reward_items')
          .update({
            is_on_sale: true,
            sale_percentage: config.discount_percentage,
            original_price: originalPrice,
            point_cost: salePrice,
            sale_start_date: startDate.toISOString(),
            sale_end_date: endDate.toISOString(),
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Error updating item ${item.id}:`, updateError);
        } else {
          itemsUpdatedCount++;
        }
      }

      console.log(`Updated ${itemsUpdatedCount} items with flash sale pricing`);
    }

    // 4. Send notifications to all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Sending notifications to ${profiles?.length || 0} users`);

    if (profiles && profiles.length > 0) {
      const notifications = profiles.map(profile => ({
        user_id: profile.user_id,
        type: 'flash_sale',
        message: `⚡ FLASH SALE ALERT! Get ${config.discount_percentage}% off on premium items for the next ${config.duration_hours} hour${config.duration_hours > 1 ? 's' : ''}!`,
        sender_id: profile.user_id,
        sender_username: 'Voice2Fire',
        is_read: false,
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error sending notifications:', notificationError);
        throw notificationError;
      }

      console.log(`Sent ${notifications.length} notifications`);
    }

    // 5. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Flash sale triggered successfully',
        banner_id: banner.id,
        items_updated: itemsUpdatedCount,
        notifications_sent: profiles?.length || 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        config,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error triggering flash sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
