import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { testId, userId, eventType } = await req.json();

    if (!testId || !userId || !eventType) {
      throw new Error('testId, userId, and eventType are required');
    }

    if (!['viewed', 'clicked', 'converted'].includes(eventType)) {
      throw new Error('Invalid eventType. Must be: viewed, clicked, or converted');
    }

    console.log(`Tracking ${eventType} event for test ${testId}, user ${userId}`);

    // Get the user's assignment for this test
    const { data: assignment } = await supabase
      .from('notification_test_assignments')
      .select('variant_id')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();

    if (!assignment) {
      throw new Error('No assignment found for this user and test');
    }

    // Update the metrics record
    const updateFields: any = {};
    
    if (eventType === 'viewed') {
      updateFields.notification_viewed = true;
      updateFields.viewed_at = new Date().toISOString();
    } else if (eventType === 'clicked') {
      updateFields.notification_clicked = true;
      updateFields.clicked_at = new Date().toISOString();
    } else if (eventType === 'converted') {
      updateFields.conversion_event = true;
      updateFields.converted_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('notification_test_metrics')
      .update(updateFields)
      .eq('test_id', testId)
      .eq('variant_id', assignment.variant_id)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`Successfully tracked ${eventType} event`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${eventType} event tracked successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error tracking event:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
