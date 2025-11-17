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

    const { testId, userId } = await req.json();

    if (!testId || !userId) {
      throw new Error('testId and userId are required');
    }

    console.log(`Assigning variant for test ${testId} to user ${userId}`);

    // Check if user already has an assignment for this test
    const { data: existingAssignment } = await supabase
      .from('notification_test_assignments')
      .select('variant_id, notification_test_variants(variant_name, message_title, message_body, cta_text, cta_link)')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();

    if (existingAssignment) {
      console.log(`User already assigned to variant`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          assignment: existingAssignment,
          isNewAssignment: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all variants for this test with their traffic allocations
    const { data: variants, error: variantsError } = await supabase
      .from('notification_test_variants')
      .select('*')
      .eq('test_id', testId)
      .order('variant_name');

    if (variantsError) throw variantsError;
    if (!variants || variants.length === 0) {
      throw new Error('No variants found for this test');
    }

    console.log(`Found ${variants.length} variants for test`);

    // Assign variant based on traffic allocation
    const random = Math.random() * 100;
    let cumulativeAllocation = 0;
    let selectedVariant = variants[0]; // fallback to first variant

    for (const variant of variants) {
      cumulativeAllocation += variant.traffic_allocation;
      if (random <= cumulativeAllocation) {
        selectedVariant = variant;
        break;
      }
    }

    console.log(`Selected variant ${selectedVariant.variant_name} for user`);

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('notification_test_assignments')
      .insert({
        test_id: testId,
        variant_id: selectedVariant.id,
        user_id: userId,
      })
      .select('*, notification_test_variants(variant_name, message_title, message_body, cta_text, cta_link)')
      .single();

    if (assignmentError) throw assignmentError;

    // Create initial metrics record
    const { error: metricsError } = await supabase
      .from('notification_test_metrics')
      .insert({
        test_id: testId,
        variant_id: selectedVariant.id,
        user_id: userId,
        notification_sent_at: new Date().toISOString(),
      });

    if (metricsError) {
      console.error('Error creating metrics record:', metricsError);
      // Don't throw - assignment was successful
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        assignment,
        isNewAssignment: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error assigning variant:', error);
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
