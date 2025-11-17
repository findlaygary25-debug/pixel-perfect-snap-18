import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // 4. Send notifications to all users with preference checking
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(1000); // Limit to avoid overwhelming the system

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Processing notifications for ${profiles?.length || 0} users`);

    let emailsSent = 0;
    if (profiles && profiles.length > 0) {
      // Get notification preferences to determine who gets in-app notifications
      const { data: allPreferences, error: allPrefsError } = await supabase
        .from('user_notification_preferences')
        .select('user_id, in_app_enabled, flash_sales_in_app, email_enabled, flash_sales_email');

      if (allPrefsError) {
        console.error('Error fetching all preferences:', allPrefsError);
      }

      // Create maps for quick lookup
      const inAppOptedIn = new Set(
        allPreferences?.filter(p => p.in_app_enabled && p.flash_sales_in_app).map(p => p.user_id) || []
      );

      // Send in-app notifications to opted-in users only
      const inAppNotifications = profiles
        .filter(profile => inAppOptedIn.has(profile.user_id))
        .map(profile => ({
          user_id: profile.user_id,
          type: 'flash_sale',
          message: `⚡ FLASH SALE ALERT! Get ${config.discount_percentage}% off on premium items for the next ${config.duration_hours} hour${config.duration_hours > 1 ? 's' : ''}!`,
          sender_id: profile.user_id,
          sender_username: 'Voice2Fire',
          is_read: false,
        }));

      if (inAppNotifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(inAppNotifications);

        if (notificationError) {
          console.error('Error sending in-app notifications:', notificationError);
          throw notificationError;
        }

        console.log(`Sent ${inAppNotifications.length} in-app notifications (${profiles.length - inAppNotifications.length} users opted out)`);
      }

      // Send email notifications with preference checking
      // Get user emails from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching user emails:', authError);
      } else if (authUsers.users && authUsers.users.length > 0) {
        // Get notification preferences for all users
        const { data: preferences, error: prefsError } = await supabase
          .from('user_notification_preferences')
          .select('user_id, email_enabled, flash_sales_email')
          .eq('email_enabled', true)
          .eq('flash_sales_email', true);

        if (prefsError) {
          console.error('Error fetching notification preferences:', prefsError);
        }

        // Create a set of user IDs who have opted in to flash sale emails
        const optedInUsers = new Set(
          preferences?.map(p => p.user_id) || []
        );

        // Filter users who have opted in
        const eligibleUsers = authUsers.users.filter(user => 
          optedInUsers.has(user.id)
        );

        console.log(`Sending emails to ${eligibleUsers.length} users (${authUsers.users.length} total, ${authUsers.users.length - eligibleUsers.length} opted out)`);
        
        // Send emails in batches to avoid rate limits
        const batchSize = 50;
        for (let i = 0; i < eligibleUsers.length; i += batchSize) {
          const batch = eligibleUsers.slice(i, i + batchSize);
          
          try {
            const emailPromises = batch.map(user => {
              if (!user.email) return Promise.resolve();
              
              return resend.emails.send({
                from: 'Voice2Fire <notifications@resend.dev>',
                to: [user.email],
                subject: `⚡ FLASH SALE: ${config.discount_percentage}% OFF!`,
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                        <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">⚡ FLASH SALE ALERT!</h1>
                        <p style="color: white; font-size: 24px; font-weight: bold; margin: 10px 0 0 0;">${config.discount_percentage}% OFF</p>
                      </div>
                      
                      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                        <h2 style="margin-top: 0; color: #111827;">Lightning Deal Active Now!</h2>
                        <p style="margin-bottom: 15px; color: #4b5563;">
                          Grab premium items at massive discounts! This exclusive flash sale is only available for the next <strong>${config.duration_hours} hour${config.duration_hours > 1 ? 's' : ''}</strong>.
                        </p>
                        <p style="margin-bottom: 20px; color: #4b5563;">
                          Don't miss out on exclusive badges, cosmetics, and premium features at unbeatable prices!
                        </p>
                        <div style="text-align: center;">
                          <a href="${Deno.env.get('SUPABASE_URL')?.replace('https://konbogydmhjhrlaskbgv.supabase.co', 'https://voice2fire.com') || 'https://voice2fire.com'}/rewards-store" 
                             style="display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Shop Flash Sale Now →
                          </a>
                        </div>
                      </div>
                      
                      <div style="text-align: center; color: #6b7280; font-size: 14px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 5px 0;">This is a limited-time offer. Sale ends at ${endDate.toLocaleString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}</p>
                        <p style="margin: 15px 0 5px 0;">© ${new Date().getFullYear()} Voice2Fire. All rights reserved.</p>
                      </div>
                    </body>
                  </html>
                `,
              }).catch(err => {
                console.error(`Failed to send email to ${user.email}:`, err);
                return null;
              });
            });
            
            const results = await Promise.allSettled(emailPromises);
            const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
            emailsSent += successful;
            
            console.log(`Batch ${Math.floor(i / batchSize) + 1}: Sent ${successful}/${batch.length} emails`);
          } catch (error) {
            console.error(`Error sending email batch:`, error);
          }
        }
        
        console.log(`Total emails sent: ${emailsSent} (to users who opted in)`);
      }
    }

    // 5. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Flash sale triggered successfully',
        banner_id: banner.id,
        items_updated: itemsUpdatedCount,
        notifications_sent: profiles?.length || 0,
        emails_sent: emailsSent,
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
