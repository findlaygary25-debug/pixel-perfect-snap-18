import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active videos with their metadata
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        caption,
        video_url,
        created_at,
        updated_at,
        views,
        likes,
        username,
        user_id
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate XML sitemap
    const baseUrl = 'https://voice2fire.com';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

    for (const video of videos || []) {
      const videoUrl = `${baseUrl}/video/${video.id}`;
      const title = video.caption || `Video by ${video.username}`;
      const description = video.caption || 'Watch this video on Voice2Fire';
      const thumbnailUrl = `${baseUrl}/favicon.png`; // Default thumbnail
      const contentUrl = video.video_url;
      const uploadDate = new Date(video.created_at).toISOString();
      
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(videoUrl)}</loc>\n`;
      xml += `    <lastmod>${escapeXml(new Date(video.updated_at).toISOString())}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '    <video:video>\n';
      xml += `      <video:thumbnail_loc>${escapeXml(thumbnailUrl)}</video:thumbnail_loc>\n`;
      xml += `      <video:title>${escapeXml(title)}</video:title>\n`;
      xml += `      <video:description>${escapeXml(description)}</video:description>\n`;
      xml += `      <video:content_loc>${escapeXml(contentUrl)}</video:content_loc>\n`;
      xml += `      <video:publication_date>${escapeXml(uploadDate)}</video:publication_date>\n`;
      xml += `      <video:view_count>${video.views}</video:view_count>\n`;
      xml += `      <video:family_friendly>yes</video:family_friendly>\n`;
      xml += `      <video:uploader info="${escapeXml(baseUrl)}/profile/${escapeXml(video.username)}">${escapeXml(video.username)}</video:uploader>\n`;
      xml += '    </video:video>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating video sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
