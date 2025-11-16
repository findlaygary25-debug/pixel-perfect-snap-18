const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const baseUrl = 'https://voice2fire.com';
    const now = new Date().toISOString();

    // Define static pages with their priorities and change frequencies
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/feed', priority: '0.9', changefreq: 'hourly' },
      { url: '/live', priority: '0.9', changefreq: 'always' },
      { url: '/store', priority: '0.8', changefreq: 'daily' },
      { url: '/upload', priority: '0.7', changefreq: 'weekly' },
      { url: '/makeup', priority: '0.7', changefreq: 'weekly' },
      { url: '/import-videos', priority: '0.7', changefreq: 'weekly' },
      { url: '/scheduled-videos', priority: '0.7', changefreq: 'daily' },
      { url: '/activity', priority: '0.6', changefreq: 'daily' },
      { url: '/wallet', priority: '0.6', changefreq: 'weekly' },
      { url: '/affiliate', priority: '0.6', changefreq: 'weekly' },
      { url: '/shares', priority: '0.6', changefreq: 'daily' },
      { url: '/analytics', priority: '0.6', changefreq: 'daily' },
      { url: '/orders', priority: '0.6', changefreq: 'daily' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/faq', priority: '0.5', changefreq: 'monthly' },
      { url: '/login', priority: '0.4', changefreq: 'yearly' },
    ];

    // Generate XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(baseUrl + page.url)}</loc>\n`;
      xml += `    <lastmod>${escapeXml(now)}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating static sitemap:', error);
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
