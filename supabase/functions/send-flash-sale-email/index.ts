import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { FlashSaleEmail } from './_templates/flash-sale-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to_email: string;
  username: string;
  discount_percentage: number;
  duration_hours: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, username, discount_percentage, duration_hours }: EmailRequest = await req.json();

    console.log(`Sending flash sale email to ${to_email}...`);

    // Get app URL from environment or use default
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('//', '//').split('.supabase.co')[0] + '.lovable.app' || 'https://app.voice2fire.com';

    // Render the React email template
    const html = await renderAsync(
      React.createElement(FlashSaleEmail, {
        username,
        discount_percentage,
        duration_hours,
        app_url: appUrl,
      })
    );

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Voice2Fire <onboarding@resend.dev>',
      to: [to_email],
      subject: `⚡ FLASH SALE! ${discount_percentage}% OFF - Hurry, ${duration_hours}h Left!`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        email_id: data?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-flash-sale-email function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
