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

    // Get the latest update dates for each content type
    const { data: latestVideo } = await supabase
      .from('videos')
      .select('updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const { data: latestProfile } = await supabase
      .from('profiles')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const { data: latestStore } = await supabase
      .from('stores')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const baseUrl = supabaseUrl.replace('//', '//').replace('supabase.co', 'supabase.co/functions/v1');
    const now = new Date().toISOString();

    // Generate XML sitemap index
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages sitemap
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/generate-static-sitemap</loc>\n`;
    xml += `    <lastmod>${escapeXml(now)}</lastmod>\n`;
    xml += '  </sitemap>\n';

    // Video sitemap
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/generate-video-sitemap</loc>\n`;
    xml += `    <lastmod>${escapeXml(latestVideo?.updated_at || now)}</lastmod>\n`;
    xml += '  </sitemap>\n';

    // Profiles sitemap
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/generate-profiles-sitemap</loc>\n`;
    xml += `    <lastmod>${escapeXml(latestProfile?.updated_at || now)}</lastmod>\n`;
    xml += '  </sitemap>\n';

    // Stores sitemap
    xml += '  <sitemap>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/generate-stores-sitemap</loc>\n`;
    xml += `    <lastmod>${escapeXml(latestStore?.updated_at || now)}</lastmod>\n`;
    xml += '  </sitemap>\n';

    xml += '</sitemapindex>';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
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
