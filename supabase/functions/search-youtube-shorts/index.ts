import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery = 'Christian shorts', maxResults = 25 } = await req.json();
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    console.log('Searching YouTube for:', searchQuery);

    // Search for short videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', searchQuery);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('videoDuration', 'short'); // Videos less than 4 minutes
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', youtubeApiKey);

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      console.error('YouTube API search error:', error);
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.items?.length || 0} videos`);

    // Get video details including duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', youtubeApiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    
    if (!detailsResponse.ok) {
      const error = await detailsResponse.json();
      console.error('YouTube API details error:', error);
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const detailsData = await detailsResponse.json();

    // Parse duration and filter for actual shorts (< 60 seconds)
    const parseDuration = (duration: string): number => {
      const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const minutes = parseInt(match[1] || '0');
      const seconds = parseInt(match[2] || '0');
      return minutes * 60 + seconds;
    };

    const videos = detailsData.items
      .filter((video: any) => {
        const durationSeconds = parseDuration(video.contentDetails.duration);
        return durationSeconds <= 60; // Only videos 60 seconds or less
      })
      .map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        duration: parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
      }));

    console.log(`Filtered to ${videos.length} actual shorts (≤60s)`);

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-youtube-shorts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
