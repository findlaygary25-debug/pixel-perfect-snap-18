import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting data integrity scan...');

    const issues: any[] = [];
    let fixedCount = 0;

    // Check 1: Profiles without usernames
    const { data: profilesWithoutUsername } = await supabase
      .from('profiles')
      .select('id, user_id')
      .or('username.is.null,username.eq.');

    if (profilesWithoutUsername && profilesWithoutUsername.length > 0) {
      for (const profile of profilesWithoutUsername) {
        const tempUsername = `user_${profile.user_id.substring(0, 8)}`;
        await supabase
          .from('profiles')
          .update({ username: tempUsername })
          .eq('id', profile.id);

        await supabase.from('ai_monitor_logs').insert({
          action_type: 'data_fix',
          target_table: 'profiles',
          target_id: profile.id,
          issue_detected: 'Missing username',
          action_taken: `Set temporary username: ${tempUsername}`,
          severity: 'medium',
          auto_fixed: true,
          metadata: { profile }
        });

        fixedCount++;
        issues.push({ type: 'missing_username', profile_id: profile.id, fixed: true });
      }
    }

    // Check 2: Orders with missing customer info
    const { data: ordersWithMissingInfo } = await supabase
      .from('orders')
      .select('id, customer_name, customer_email')
      .or('customer_name.eq.,customer_email.eq.');

    if (ordersWithMissingInfo && ordersWithMissingInfo.length > 0) {
      for (const order of ordersWithMissingInfo) {
        await supabase.from('ai_monitor_logs').insert({
          action_type: 'data_fix',
          target_table: 'orders',
          target_id: order.id,
          issue_detected: 'Missing customer information',
          action_taken: 'Logged for manual review',
          severity: 'high',
          auto_fixed: false,
          metadata: { order }
        });

        issues.push({ type: 'missing_order_info', order_id: order.id, fixed: false });
      }
    }

    // Check 3: Videos without proper metadata
    const { data: videosWithoutMetadata } = await supabase
      .from('videos')
      .select('id, title, description')
      .or('title.is.null,title.eq.');

    if (videosWithoutMetadata && videosWithoutMetadata.length > 0) {
      for (const video of videosWithoutMetadata) {
        await supabase
          .from('videos')
          .update({ title: 'Untitled Video' })
          .eq('id', video.id);

        await supabase.from('ai_monitor_logs').insert({
          action_type: 'data_fix',
          target_table: 'videos',
          target_id: video.id,
          issue_detected: 'Missing video title',
          action_taken: 'Set default title: "Untitled Video"',
          severity: 'low',
          auto_fixed: true,
          metadata: { video }
        });

        fixedCount++;
        issues.push({ type: 'missing_video_title', video_id: video.id, fixed: true });
      }
    }

    // Check 4: Gift balances not initialized
    const { data: usersWithoutGiftBalance } = await supabase
      .from('profiles')
      .select('user_id')
      .not('user_id', 'in', `(SELECT user_id FROM gift_balances)`);

    if (usersWithoutGiftBalance && usersWithoutGiftBalance.length > 0) {
      for (const profile of usersWithoutGiftBalance) {
        await supabase.from('gift_balances').insert({
          user_id: profile.user_id,
          total_sent: 0,
          total_received: 0
        });

        await supabase.from('ai_monitor_logs').insert({
          action_type: 'data_fix',
          target_table: 'gift_balances',
          target_id: profile.user_id,
          issue_detected: 'Missing gift balance record',
          action_taken: 'Initialized gift balance',
          severity: 'medium',
          auto_fixed: true,
          metadata: { user_id: profile.user_id }
        });

        fixedCount++;
        issues.push({ type: 'missing_gift_balance', user_id: profile.user_id, fixed: true });
      }
    }

    console.log(`Scan complete. Found ${issues.length} issues, fixed ${fixedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalIssues: issues.length,
        fixedCount,
        issues
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-data-integrity-scan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
