import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationConfig {
  id: string;
  alert_type: string;
  escalation_level: number;
  time_threshold_minutes: number;
  target_role: string;
  notification_channels: string[];
}

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  escalation_level: number;
  escalated_at: string | null;
  escalated_to: string[];
  escalation_history: any[];
  resolved: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting alert escalation check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Get all unresolved alerts
    const { data: unresolvedAlerts, error: alertsError } = await supabase
      .from('delivery_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: true });

    if (alertsError) throw alertsError;

    if (!unresolvedAlerts || unresolvedAlerts.length === 0) {
      console.log('No unresolved alerts to process');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No unresolved alerts',
          processed: 0
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${unresolvedAlerts.length} unresolved alerts`);

    // Get escalation configurations
    const { data: escalationConfigs, error: configError } = await supabase
      .from('alert_escalation_config')
      .select('*')
      .order('alert_type', { ascending: true })
      .order('escalation_level', { ascending: true });

    if (configError) throw configError;

    console.log(`Loaded ${escalationConfigs?.length || 0} escalation rules`);

    let escalatedCount = 0;
    const escalationResults = [];

    for (const alert of unresolvedAlerts as Alert[]) {
      try {
        // Find matching escalation configs for this alert's severity
        const relevantConfigs = (escalationConfigs || [])
          .filter((config: EscalationConfig) => 
            config.alert_type === alert.severity
          )
          .sort((a: EscalationConfig, b: EscalationConfig) => 
            a.escalation_level - b.escalation_level
          );

        if (relevantConfigs.length === 0) {
          console.log(`No escalation rules for ${alert.severity} alerts`);
          continue;
        }

        // Determine alert age in minutes
        const alertAge = (now.getTime() - new Date(alert.created_at).getTime()) / (1000 * 60);
        const currentLevel = alert.escalation_level || 0;

        // Check if we should escalate to the next level
        const nextConfig = relevantConfigs.find((config: EscalationConfig) => 
          config.escalation_level === currentLevel + 1
        );

        if (!nextConfig) {
          // Already at maximum escalation level
          console.log(`Alert ${alert.id} already at max escalation level ${currentLevel}`);
          continue;
        }

        // Calculate time since last escalation or alert creation
        const lastEscalationTime = alert.escalated_at 
          ? new Date(alert.escalated_at)
          : new Date(alert.created_at);
        const timeSinceLastEscalation = (now.getTime() - lastEscalationTime.getTime()) / (1000 * 60);

        if (timeSinceLastEscalation >= nextConfig.time_threshold_minutes) {
          console.log(`Escalating alert ${alert.id} to level ${nextConfig.escalation_level}`);
          
          // Get target admins based on role
          const { data: targetAdmins, error: adminsError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', nextConfig.target_role);

          if (adminsError) {
            console.error('Error fetching target admins:', adminsError);
            continue;
          }

          if (!targetAdmins || targetAdmins.length === 0) {
            console.warn(`No ${nextConfig.target_role} users found for escalation`);
            continue;
          }

          const adminIds = targetAdmins.map(a => a.user_id);
          
          // Send escalation notifications
          const notificationSent = await sendEscalationNotification(
            alert,
            nextConfig,
            adminIds,
            supabase
          );

          if (notificationSent) {
            // Update alert with new escalation level
            const newEscalationHistory = [
              ...(alert.escalation_history || []),
              {
                level: nextConfig.escalation_level,
                timestamp: now.toISOString(),
                notified_admins: adminIds.length,
                channels: nextConfig.notification_channels,
              }
            ];

            const { error: updateError } = await supabase
              .from('delivery_alerts')
              .update({
                escalation_level: nextConfig.escalation_level,
                escalated_at: now.toISOString(),
                escalated_to: adminIds,
                escalation_history: newEscalationHistory,
              })
              .eq('id', alert.id);

            if (updateError) {
              console.error('Error updating alert escalation:', updateError);
            } else {
              escalatedCount++;
              escalationResults.push({
                alert_id: alert.id,
                from_level: currentLevel,
                to_level: nextConfig.escalation_level,
                notified_admins: adminIds.length,
              });
              console.log(`Successfully escalated alert ${alert.id} to level ${nextConfig.escalation_level}`);
            }
          }
        } else {
          const timeRemaining = nextConfig.time_threshold_minutes - timeSinceLastEscalation;
          console.log(`Alert ${alert.id} not yet ready for escalation (${timeRemaining.toFixed(1)} min remaining)`);
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: unresolvedAlerts.length,
        escalated: escalatedCount,
        escalations: escalationResults,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Escalation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Escalation failed', details: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendEscalationNotification(
  alert: Alert,
  config: EscalationConfig,
  adminIds: string[],
  supabase: any
): Promise<boolean> {
  try {
    console.log(`Sending escalation notification for alert ${alert.id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const escalationMessage = `🔴 ESCALATED ALERT (Level ${config.escalation_level})\n\n` +
      `${alert.title}\n\n` +
      `${alert.description}\n\n` +
      `⏰ Alert Age: ${Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60))} minutes\n` +
      `⚡ Escalation: Level ${alert.escalation_level} → Level ${config.escalation_level}\n\n` +
      `This alert has been unresolved and requires immediate attention.`;

    // Determine which channels to use based on escalation config
    const useEmail = config.notification_channels.includes('email');
    const useSMS = config.notification_channels.includes('sms');
    const useInApp = config.notification_channels.includes('in_app');

    // Call send-admin-notification for each admin
    const notificationPromises = adminIds.map(async (adminId) => {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-admin-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notification_type: 'system_errors',
              title: `🔴 ESCALATED: ${alert.title}`,
              message: escalationMessage,
              priority: 'high',
              target_admin_ids: [adminId],
              metadata: {
                alert_id: alert.id,
                escalation_level: config.escalation_level,
                alert_age_minutes: Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60)),
                channels_used: config.notification_channels,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send escalation notification to admin ${adminId}:`, errorText);
          return false;
        }

        const result = await response.json();
        console.log(`Escalation notification sent to admin ${adminId}:`, result);
        return true;
      } catch (error) {
        console.error(`Error sending escalation notification to admin ${adminId}:`, error);
        return false;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r).length;

    console.log(`Sent ${successCount}/${adminIds.length} escalation notifications`);
    return successCount > 0;

  } catch (error) {
    console.error('Error in sendEscalationNotification:', error);
    return false;
  }
}
