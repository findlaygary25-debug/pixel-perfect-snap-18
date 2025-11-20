import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  admin_user_ids?: string[];
  notification_type: 'pending_orders' | 'new_users' | 'ending_sales' | 'system_errors' | 'high_value_orders';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action_url?: string;
  order_value?: number;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

// Phone number validation (E.164 format)
const validatePhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

// Format SMS message (keep under 160 characters when possible)
const formatSMSMessage = (title: string, message: string, priority: string, action_url?: string): string => {
  const priorityPrefix = `[${priority.toUpperCase()}]`;
  let smsText = `${priorityPrefix} ${title}: ${message}`;
  
  if (action_url && smsText.length < 120) {
    smsText += ` ${action_url}`;
  }
  
  return smsText;
};

// Send SMS via Twilio REST API
const sendSMS = async (to: string, body: string): Promise<{ success: boolean; messageSid?: string; error?: string }> => {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return { success: false, error: "Twilio credentials not configured" };
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: body,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, messageSid: data.sid };
    } else {
      const error = await response.text();
      console.error("Twilio API error:", error);
      return { success: false, error: error };
    }
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      admin_user_ids,
      notification_type,
      title,
      message,
      priority,
      action_url,
      order_value
    }: NotificationRequest = await req.json();

    console.log("Processing admin notification:", { notification_type, title });

    // Get all admin users if not specified
    let targetAdmins = admin_user_ids;
    
    if (!targetAdmins || targetAdmins.length === 0) {
      const { data: adminRoles } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      targetAdmins = adminRoles?.map(r => r.user_id) || [];
    }

    if (targetAdmins.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users found" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailsSent = [];
    const emailsFailed = [];
    const smsSent = [];
    const smsFailed = [];

    // Process each admin
    for (const userId of targetAdmins) {
      try {
        // Get admin preferences
        const { data: prefs } = await supabaseClient
          .from('admin_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Check if we should send email for this notification type
        const shouldSendEmail = prefs?.email_enabled && 
          prefs?.[`${notification_type}_email` as keyof typeof prefs];

        // Check if we should send SMS for this notification type
        const shouldSendSMS = prefs?.sms_enabled && 
          prefs?.[`${notification_type}_sms` as keyof typeof prefs];

        // Check high value order threshold
        if (notification_type === 'high_value_orders' && order_value) {
          const threshold = prefs?.high_value_order_threshold || 1000;
          if (order_value < threshold) {
            console.log(`Order value $${order_value} below threshold $${threshold} for user ${userId}`);
            continue;
          }
        }

        // Send Email Notification
        if (shouldSendEmail && prefs?.notification_email) {
          const emailResult = await resend.emails.send({
            from: "Voice2Fire Admin <support@voice2fire.com>",
            to: [prefs.notification_email],
            subject: `[${priority.toUpperCase()}] ${title}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                    .priority { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 10px; }
                    .priority-high { background: #fecaca; color: #991b1b; }
                    .priority-medium { background: #fef3c7; color: #92400e; }
                    .priority-low { background: #d1fae5; color: #065f46; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1 style="margin: 0; font-size: 24px;">Voice2Fire Admin Alert</h1>
                      <span class="priority priority-${priority}">${priority}</span>
                    </div>
                    <div class="content">
                      <h2 style="margin-top: 0; color: #111827;">${title}</h2>
                      <p style="color: #4b5563; line-height: 1.6;">${message}</p>
                      ${action_url ? `<a href="${action_url}" class="button">View Details</a>` : ''}
                      <div class="footer">
                        <p>You received this notification because you are an administrator.</p>
                        <p>Manage your notification preferences in the Admin Dashboard.</p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });

          const emailStatus = emailResult.error ? 'failed' : 'sent';
          const emailExternalId = emailResult.data?.id || null;
          const emailError = emailResult.error ? JSON.stringify(emailResult.error) : null;

          // Log email delivery
          await supabaseClient.from('notification_delivery_logs').insert({
            notification_type,
            recipient_id: userId,
            recipient_identifier: prefs.notification_email,
            channel: 'email',
            status: emailStatus,
            title,
            message,
            priority,
            error_message: emailError,
            external_id: emailExternalId,
            metadata: {
              action_url,
              order_value,
            },
          });

          if (emailResult.error) {
            console.error(`Email failed for ${prefs.notification_email}:`, emailResult.error);
            emailsFailed.push(prefs.notification_email);
          } else {
            console.log(`Email sent to ${prefs.notification_email}`);
            emailsSent.push(prefs.notification_email);
          }
        }

        // Send SMS Notification
        if (shouldSendSMS && prefs?.notification_phone) {
          // Validate phone number
          if (!validatePhoneNumber(prefs.notification_phone)) {
            const errorMsg = `Invalid phone number format: ${prefs.notification_phone.slice(-4)}`;
            console.error(errorMsg);
            
            // Log failed SMS due to invalid phone
            await supabaseClient.from('notification_delivery_logs').insert({
              notification_type,
              recipient_id: userId,
              recipient_identifier: `***${prefs.notification_phone.slice(-4)}`,
              channel: 'sms',
              status: 'failed',
              title,
              message,
              priority,
              error_message: errorMsg,
              metadata: {
                action_url,
                order_value,
              },
            });
            
            smsFailed.push(`***${prefs.notification_phone.slice(-4)}`);
            continue;
          }

          // Format and send SMS
          const smsBody = formatSMSMessage(title, message, priority, action_url);
          const smsResult = await sendSMS(prefs.notification_phone, smsBody);

          const smsStatus = smsResult.success ? 'sent' : 'failed';
          const smsExternalId = smsResult.messageSid || null;
          const smsError = smsResult.error || null;

          // Log SMS delivery
          await supabaseClient.from('notification_delivery_logs').insert({
            notification_type,
            recipient_id: userId,
            recipient_identifier: `***${prefs.notification_phone.slice(-4)}`,
            channel: 'sms',
            status: smsStatus,
            title,
            message: smsBody,
            priority,
            error_message: smsError,
            external_id: smsExternalId,
            metadata: {
              action_url,
              order_value,
            },
          });

          if (smsResult.success) {
            console.log(`SMS sent to ***${prefs.notification_phone.slice(-4)} (SID: ${smsResult.messageSid})`);
            smsSent.push(`***${prefs.notification_phone.slice(-4)}`);
          } else {
            console.error(`SMS failed for ***${prefs.notification_phone.slice(-4)}: ${smsResult.error}`);
            smsFailed.push(`***${prefs.notification_phone.slice(-4)}`);
          }
        }
        
      } catch (error) {
        console.error(`Error processing notifications for user ${userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent.length,
        emails_failed: emailsFailed.length,
        sms_sent: smsSent.length,
        sms_failed: smsFailed.length,
        emails_sent_to: emailsSent,
        sms_sent_to: smsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
