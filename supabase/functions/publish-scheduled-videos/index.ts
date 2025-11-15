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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for videos to publish...');

    // Get all pending videos that should be published now
    const { data: scheduledVideos, error: fetchError } = await supabase
      .from('scheduled_videos')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true });

    if (fetchError) {
      console.error('Error fetching scheduled videos:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledVideos?.length || 0} videos to publish`);

    if (!scheduledVideos || scheduledVideos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No videos to publish', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each scheduled video
    for (const scheduledVideo of scheduledVideos) {
      try {
        console.log(`Publishing video: ${scheduledVideo.youtube_title}`);

        // Get user's username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', scheduledVideo.user_id)
          .single();

        // Create the caption
        const caption = `${scheduledVideo.youtube_title}\n\nSource: ${scheduledVideo.youtube_channel} on YouTube${scheduledVideo.youtube_description ? '\n' + scheduledVideo.youtube_description.slice(0, 200) : ''}${scheduledVideo.youtube_description && scheduledVideo.youtube_description.length > 200 ? '...' : ''}`;

        // Insert the video
        const { data: publishedVideo, error: insertError } = await supabase
          .from('videos')
          .insert({
            user_id: scheduledVideo.user_id,
            username: profile?.username || 'Anonymous',
            video_url: scheduledVideo.youtube_embed_url,
            caption: caption,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error publishing video ${scheduledVideo.id}:`, insertError);
          
          // Mark as failed
          await supabase
            .from('scheduled_videos')
            .update({ status: 'failed' })
            .eq('id', scheduledVideo.id);

          results.push({
            id: scheduledVideo.id,
            title: scheduledVideo.youtube_title,
            status: 'failed',
            error: insertError.message,
          });
          continue;
        }

        // Update scheduled video status to published
        const { error: updateError } = await supabase
          .from('scheduled_videos')
          .update({
            status: 'published',
            published_video_id: publishedVideo.id,
          })
          .eq('id', scheduledVideo.id);

        if (updateError) {
          console.error(`Error updating scheduled video ${scheduledVideo.id}:`, updateError);
        }

        results.push({
          id: scheduledVideo.id,
          title: scheduledVideo.youtube_title,
          status: 'published',
          videoId: publishedVideo.id,
        });

        console.log(`Successfully published: ${scheduledVideo.youtube_title}`);
      } catch (error) {
        console.error(`Error processing video ${scheduledVideo.id}:`, error);
        results.push({
          id: scheduledVideo.id,
          title: scheduledVideo.youtube_title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.status === 'published').length;
    const failCount = results.filter(r => r.status !== 'published').length;

    console.log(`Publishing complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Published ${successCount} videos, ${failCount} failed`,
        results,
        successCount,
        failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in publish-scheduled-videos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
