import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Analyzing engagement data for user:', user.id);

    // Get user's videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, created_at, views, likes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (videosError) throw videosError;

    // Get video views with timestamps
    const videoIds = videos?.map(v => v.id) || [];
    const { data: viewsData, error: viewsError } = await supabase
      .from('video_views')
      .select('video_id, created_at')
      .in('video_id', videoIds)
      .order('created_at', { ascending: false })
      .limit(500);

    if (viewsError) throw viewsError;

    // Get engagement data
    const { data: engagementData, error: engagementError } = await supabase
      .from('video_engagement')
      .select('video_id, engagement_type, created_at')
      .in('video_id', videoIds)
      .order('created_at', { ascending: false })
      .limit(500);

    if (engagementError) throw engagementError;

    // Get shares data
    const { data: sharesData, error: sharesError } = await supabase
      .from('social_shares')
      .select('video_id, shared_at, platform')
      .in('video_id', videoIds)
      .order('shared_at', { ascending: false })
      .limit(500);

    if (sharesError) throw sharesError;

    // Prepare analytics summary for AI
    const analyticsSummary: {
      totalVideos: number;
      totalViews: number;
      totalEngagements: number;
      totalShares: number;
      viewsByHour: Record<number, number>;
      viewsByDayOfWeek: Record<number, number>;
      engagementsByHour: Record<number, number>;
      topPerformingVideos: Array<{ created_at: string; views: number; likes: number }>;
    } = {
      totalVideos: videos?.length || 0,
      totalViews: viewsData?.length || 0,
      totalEngagements: engagementData?.length || 0,
      totalShares: sharesData?.length || 0,
      viewsByHour: {},
      viewsByDayOfWeek: {},
      engagementsByHour: {},
      topPerformingVideos: videos?.slice(0, 10).map(v => ({
        created_at: v.created_at,
        views: v.views,
        likes: v.likes,
      })) || [],
    };

    // Analyze views by hour and day
    viewsData?.forEach(view => {
      const date = new Date(view.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      analyticsSummary.viewsByHour[hour] = (analyticsSummary.viewsByHour[hour] || 0) + 1;
      analyticsSummary.viewsByDayOfWeek[dayOfWeek] = (analyticsSummary.viewsByDayOfWeek[dayOfWeek] || 0) + 1;
    });

    engagementData?.forEach(engagement => {
      const date = new Date(engagement.created_at);
      const hour = date.getHours();
      analyticsSummary.engagementsByHour[hour] = (analyticsSummary.engagementsByHour[hour] || 0) + 1;
    });

    console.log('Analytics summary prepared:', analyticsSummary);

    // Use Lovable AI to analyze and recommend
    const aiPrompt = `You are an expert social media analytics advisor. Analyze this engagement data and provide optimal posting time recommendations.

Analytics Data:
${JSON.stringify(analyticsSummary, null, 2)}

Based on this data, recommend 5 optimal times to schedule videos for maximum engagement. Consider:
1. Hours with highest view counts
2. Days of week with best engagement
3. Industry best practices for social media
4. Balance between different days to maintain consistent presence

Provide specific recommendations with reasoning.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analytics expert. Provide clear, actionable scheduling recommendations based on engagement data.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'recommend_schedule_times',
            description: 'Provide 5 optimal posting time recommendations',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      dayOfWeek: {
                        type: 'string',
                        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                      },
                      hour: {
                        type: 'number',
                        minimum: 0,
                        maximum: 23
                      },
                      minute: {
                        type: 'number',
                        enum: [0, 30]
                      },
                      reason: {
                        type: 'string',
                        description: 'Brief explanation of why this time is optimal'
                      },
                      confidence: {
                        type: 'string',
                        enum: ['high', 'medium', 'low']
                      }
                    },
                    required: ['dayOfWeek', 'hour', 'minute', 'reason', 'confidence']
                  },
                  minItems: 5,
                  maxItems: 5
                },
                overallInsight: {
                  type: 'string',
                  description: 'Overall insight about the audience engagement patterns'
                }
              },
              required: ['recommendations', 'overallInsight']
            }
          }
        }],
        tool_choice: {
          type: 'function',
          function: { name: 'recommend_schedule_times' }
        }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI analysis complete');

    // Extract the structured data from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No recommendations generated');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...recommendations,
        analytics: {
          totalVideos: analyticsSummary.totalVideos,
          totalViews: analyticsSummary.totalViews,
          totalEngagements: analyticsSummary.totalEngagements,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-optimal-schedule-times function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
