import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

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

        // Check high value order threshold
        if (notification_type === 'high_value_orders' && order_value) {
          const threshold = prefs?.high_value_order_threshold || 1000;
          if (order_value < threshold) {
            console.log(`Order value $${order_value} below threshold $${threshold} for user ${userId}`);
            continue;
          }
        }

        if (shouldSendEmail && prefs?.notification_email) {
          // Send email notification
          const emailResult = await resend.emails.send({
            from: "Voice2Fire Admin <onboarding@resend.dev>",
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
                    .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                    .priority-high { background: #fee2e2; color: #991b1b; }
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

          if (emailResult.error) {
            console.error(`Email failed for ${prefs.notification_email}:`, emailResult.error);
            emailsFailed.push(prefs.notification_email);
          } else {
            console.log(`Email sent to ${prefs.notification_email}`);
            emailsSent.push(prefs.notification_email);
          }
        }

        // SMS notifications would go here if implemented
        // if (prefs?.sms_enabled && prefs?.[`${notification_type}_sms`]) { ... }
        
      } catch (error) {
        console.error(`Error processing notifications for user ${userId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent.length,
        emails_failed: emailsFailed.length,
        emails_sent_to: emailsSent,
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
