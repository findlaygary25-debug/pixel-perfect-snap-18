import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TwilioWebhookData {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  To?: string;
  From?: string;
}

// Map Twilio status to our internal status
const mapTwilioStatus = (twilioStatus: string): string => {
  switch (twilioStatus.toLowerCase()) {
    case 'delivered':
      return 'sent';
    case 'undelivered':
    case 'failed':
      return 'failed';
    case 'queued':
    case 'sent':
    case 'sending':
      return 'sent';
    default:
      return 'sent';
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Twilio webhook received');

    // Parse form-encoded data from Twilio
    const formData = await req.formData();
    const webhookData: TwilioWebhookData = {
      MessageSid: formData.get('MessageSid') as string,
      MessageStatus: formData.get('MessageStatus') as string,
      ErrorCode: formData.get('ErrorCode') as string || undefined,
      ErrorMessage: formData.get('ErrorMessage') as string || undefined,
      To: formData.get('To') as string || undefined,
      From: formData.get('From') as string || undefined,
    };

    console.log('Webhook data:', {
      MessageSid: webhookData.MessageSid,
      MessageStatus: webhookData.MessageStatus,
      ErrorCode: webhookData.ErrorCode,
    });

    // Validate required fields
    if (!webhookData.MessageSid || !webhookData.MessageStatus) {
      console.error('Missing required fields in webhook');
      // Return 200 to prevent Twilio retries
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare update data
    const updateData: any = {
      delivery_status: webhookData.MessageStatus.toLowerCase(),
      status: mapTwilioStatus(webhookData.MessageStatus),
      last_status_update: new Date().toISOString(),
    };

    // Set delivered_at if message was delivered
    if (webhookData.MessageStatus.toLowerCase() === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Set failed_reason if there's an error
    if (webhookData.ErrorCode || webhookData.ErrorMessage) {
      updateData.failed_reason = webhookData.ErrorMessage 
        ? `${webhookData.ErrorCode || ''}: ${webhookData.ErrorMessage}`.trim()
        : webhookData.ErrorCode;
    }

    // Update the notification log
    const { data, error } = await supabase
      .from('notification_delivery_logs')
      .update(updateData)
      .eq('external_id', webhookData.MessageSid)
      .eq('channel', 'sms')
      .select('id, recipient_identifier');

    if (error) {
      console.error('Error updating notification log:', error);
      // Still return 200 to prevent Twilio retries
      return new Response(
        JSON.stringify({ error: 'Database update failed', details: error.message }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data || data.length === 0) {
      console.warn('No matching log entry found for MessageSid:', webhookData.MessageSid);
      // This might happen if webhook arrives before initial log creation
      // Return 200 to acknowledge receipt
      return new Response(
        JSON.stringify({ warning: 'No matching log entry found' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully updated notification log:', {
      id: data[0].id,
      recipient: data[0].recipient_identifier,
      status: webhookData.MessageStatus,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: data.length,
        status: webhookData.MessageStatus 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Return 200 even on error to prevent Twilio retries
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
