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
    const { contentId, contentType = 'comment', content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Auto-moderating content:', { contentType, contentId, contentLength: content.length });

    // Call AI moderation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderator. Analyze content for inappropriate material including hate speech, harassment, explicit content, spam, or violence. Respond with a JSON object containing: {"appropriate": true/false, "reason": "explanation if inappropriate", "severity": "low/medium/high" if inappropriate}'
          },
          {
            role: 'user',
            content: `Moderate this ${contentType}: "${content}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI moderation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;
    
    let moderationResult;
    try {
      moderationResult = JSON.parse(result);
    } catch {
      moderationResult = {
        appropriate: !result.toLowerCase().includes('inappropriate'),
        reason: result,
        severity: 'low'
      };
    }

    // Log the action
    const logData = {
      action_type: 'content_moderation',
      target_table: contentType === 'comment' ? 'comments' : 'videos',
      target_id: contentId,
      issue_detected: moderationResult.appropriate ? null : moderationResult.reason,
      action_taken: moderationResult.appropriate ? 'Content approved' : 'Content flagged',
      severity: moderationResult.appropriate ? 'low' : moderationResult.severity,
      auto_fixed: !moderationResult.appropriate,
      metadata: { moderationResult, contentType, content }
    };

    await supabase.from('ai_monitor_logs').insert(logData);

    // If inappropriate, flag the content
    if (!moderationResult.appropriate && contentType === 'comment') {
      await supabase
        .from('comments')
        .update({
          flagged: true,
          moderation_reason: moderationResult.reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', contentId);
    }

    return new Response(
      JSON.stringify({ 
        ...moderationResult,
        logged: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-auto-moderate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
