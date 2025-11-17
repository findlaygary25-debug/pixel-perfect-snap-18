import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryMetrics {
  totalSMS: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  failureRate: number;
  errorCounts: Record<string, number>;
}

interface Alert {
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_value?: number;
  threshold_value?: number;
  affected_period_start: string;
  affected_period_end: string;
  metadata: any;
}

// Configuration thresholds
const THRESHOLDS = {
  MIN_DELIVERY_RATE: 85, // Alert if delivery rate < 85%
  MAX_FAILURE_RATE: 15, // Alert if failure rate > 15%
  ERROR_PATTERN_COUNT: 5, // Alert if same error occurs 5+ times
  SUDDEN_DROP_PERCENT: 20, // Alert if delivery rate drops 20% compared to previous period
  MIN_SAMPLE_SIZE: 10, // Minimum SMS count to analyze
};

const MONITORING_PERIODS = {
  CURRENT: 60, // Last 60 minutes
  PREVIOUS: 60, // Previous 60 minutes for comparison
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting SMS delivery monitoring...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - MONITORING_PERIODS.CURRENT * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - (MONITORING_PERIODS.CURRENT + MONITORING_PERIODS.PREVIOUS) * 60 * 1000);
    const previousPeriodEnd = currentPeriodStart;

    // Fetch current period SMS logs
    const { data: currentLogs, error: currentError } = await supabase
      .from('notification_delivery_logs')
      .select('*')
      .eq('channel', 'sms')
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', now.toISOString());

    if (currentError) throw currentError;

    // Fetch previous period SMS logs for comparison
    const { data: previousLogs, error: previousError } = await supabase
      .from('notification_delivery_logs')
      .select('*')
      .eq('channel', 'sms')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString());

    if (previousError) throw previousError;

    console.log(`Analyzing ${currentLogs?.length || 0} current SMS logs and ${previousLogs?.length || 0} previous logs`);

    // Skip if insufficient data
    if (!currentLogs || currentLogs.length < THRESHOLDS.MIN_SAMPLE_SIZE) {
      console.log('Insufficient SMS data for analysis');
      return new Response(
        JSON.stringify({ 
          message: 'Insufficient data for analysis',
          sample_size: currentLogs?.length || 0,
          required: THRESHOLDS.MIN_SAMPLE_SIZE
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate metrics
    const currentMetrics = calculateMetrics(currentLogs);
    const previousMetrics = previousLogs && previousLogs.length >= THRESHOLDS.MIN_SAMPLE_SIZE 
      ? calculateMetrics(previousLogs) 
      : null;

    console.log('Current metrics:', currentMetrics);
    console.log('Previous metrics:', previousMetrics);

    // Detect issues and create alerts
    const alerts: Alert[] = [];

    // 1. Check for low delivery rate
    if (currentMetrics.deliveryRate < THRESHOLDS.MIN_DELIVERY_RATE) {
      alerts.push({
        alert_type: 'low_delivery_rate',
        severity: currentMetrics.deliveryRate < 70 ? 'critical' : 'high',
        title: '⚠️ Low SMS Delivery Rate Detected',
        description: `SMS delivery rate has dropped to ${currentMetrics.deliveryRate.toFixed(1)}%, below the ${THRESHOLDS.MIN_DELIVERY_RATE}% threshold. ${currentMetrics.delivered} out of ${currentMetrics.totalSMS} messages were delivered in the last ${MONITORING_PERIODS.CURRENT} minutes.`,
        metric_value: currentMetrics.deliveryRate,
        threshold_value: THRESHOLDS.MIN_DELIVERY_RATE,
        affected_period_start: currentPeriodStart.toISOString(),
        affected_period_end: now.toISOString(),
        metadata: {
          total_sms: currentMetrics.totalSMS,
          delivered: currentMetrics.delivered,
          failed: currentMetrics.failed,
          pending: currentMetrics.pending,
        }
      });
    }

    // 2. Check for high failure rate
    if (currentMetrics.failureRate > THRESHOLDS.MAX_FAILURE_RATE) {
      alerts.push({
        alert_type: 'high_failure_rate',
        severity: currentMetrics.failureRate > 30 ? 'critical' : 'high',
        title: '🚨 High SMS Failure Rate Detected',
        description: `SMS failure rate is ${currentMetrics.failureRate.toFixed(1)}%, exceeding the ${THRESHOLDS.MAX_FAILURE_RATE}% threshold. ${currentMetrics.failed} out of ${currentMetrics.totalSMS} messages failed in the last ${MONITORING_PERIODS.CURRENT} minutes.`,
        metric_value: currentMetrics.failureRate,
        threshold_value: THRESHOLDS.MAX_FAILURE_RATE,
        affected_period_start: currentPeriodStart.toISOString(),
        affected_period_end: now.toISOString(),
        metadata: {
          total_sms: currentMetrics.totalSMS,
          failed: currentMetrics.failed,
          failure_rate: currentMetrics.failureRate,
        }
      });
    }

    // 3. Check for error patterns
    for (const [error, count] of Object.entries(currentMetrics.errorCounts)) {
      if (count >= THRESHOLDS.ERROR_PATTERN_COUNT) {
        alerts.push({
          alert_type: 'error_pattern',
          severity: count > 10 ? 'high' : 'medium',
          title: '🔍 Recurring SMS Error Pattern Detected',
          description: `The error "${error}" has occurred ${count} times in the last ${MONITORING_PERIODS.CURRENT} minutes, exceeding the ${THRESHOLDS.ERROR_PATTERN_COUNT} occurrence threshold. This may indicate a systemic issue.`,
          metric_value: count,
          threshold_value: THRESHOLDS.ERROR_PATTERN_COUNT,
          affected_period_start: currentPeriodStart.toISOString(),
          affected_period_end: now.toISOString(),
          metadata: {
            error_message: error,
            occurrence_count: count,
            total_failures: currentMetrics.failed,
          }
        });
      }
    }

    // 4. Check for sudden drop compared to previous period
    if (previousMetrics && previousMetrics.totalSMS >= THRESHOLDS.MIN_SAMPLE_SIZE) {
      const deliveryRateDrop = previousMetrics.deliveryRate - currentMetrics.deliveryRate;
      
      if (deliveryRateDrop >= THRESHOLDS.SUDDEN_DROP_PERCENT) {
        alerts.push({
          alert_type: 'sudden_drop',
          severity: deliveryRateDrop >= 30 ? 'critical' : 'high',
          title: '📉 Sudden Drop in SMS Delivery Rate',
          description: `SMS delivery rate dropped by ${deliveryRateDrop.toFixed(1)}% compared to the previous ${MONITORING_PERIODS.PREVIOUS}-minute period. Current: ${currentMetrics.deliveryRate.toFixed(1)}%, Previous: ${previousMetrics.deliveryRate.toFixed(1)}%.`,
          metric_value: deliveryRateDrop,
          threshold_value: THRESHOLDS.SUDDEN_DROP_PERCENT,
          affected_period_start: currentPeriodStart.toISOString(),
          affected_period_end: now.toISOString(),
          metadata: {
            current_rate: currentMetrics.deliveryRate,
            previous_rate: previousMetrics.deliveryRate,
            rate_drop: deliveryRateDrop,
          }
        });
      }
    }

    console.log(`Detected ${alerts.length} alerts`);

    // Store alerts and send notifications
    const alertResults = [];
    for (const alert of alerts) {
      // Check for duplicate alert in last 30 minutes
      const { data: existingAlerts } = await supabase
        .from('delivery_alerts')
        .select('id')
        .eq('alert_type', alert.alert_type)
        .eq('resolved', false)
        .gte('created_at', new Date(now.getTime() - 30 * 60 * 1000).toISOString())
        .limit(1);

      if (existingAlerts && existingAlerts.length > 0) {
        console.log(`Skipping duplicate alert: ${alert.alert_type}`);
        continue;
      }

      // Insert alert into database
      const { data: insertedAlert, error: insertError } = await supabase
        .from('delivery_alerts')
        .insert(alert)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting alert:', insertError);
        continue;
      }

      // Send admin notification (non-blocking)
      sendAdminNotification(alert, supabase).then(() => {
        // Mark alert as sent after notification is sent
        supabase
          .from('delivery_alerts')
          .update({ 
            alert_sent: true, 
            alert_sent_at: now.toISOString() 
          })
          .eq('id', insertedAlert.id);
      }).catch(err => {
        console.error('Failed to send notification:', err);
      });

      alertResults.push({
        id: insertedAlert.id,
        type: alert.alert_type,
        severity: alert.severity,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        monitored_period: `${MONITORING_PERIODS.CURRENT} minutes`,
        metrics: currentMetrics,
        previous_metrics: previousMetrics,
        alerts_triggered: alertResults.length,
        alerts: alertResults,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Monitoring error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Monitoring failed', details: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateMetrics(logs: any[]): DeliveryMetrics {
  const totalSMS = logs.length;
  const delivered = logs.filter(log => log.delivery_status === 'delivered').length;
  const failed = logs.filter(log => 
    log.status === 'failed' || 
    ['failed', 'undelivered'].includes(log.delivery_status)
  ).length;
  const pending = logs.filter(log => 
    log.status === 'sent' && 
    (!log.delivery_status || ['queued', 'sent', 'sending'].includes(log.delivery_status))
  ).length;

  const deliveryRate = totalSMS > 0 ? (delivered / totalSMS) * 100 : 0;
  const failureRate = totalSMS > 0 ? (failed / totalSMS) * 100 : 0;

  // Count error occurrences
  const errorCounts: Record<string, number> = {};
  logs
    .filter(log => log.failed_reason || log.error_message)
    .forEach(log => {
      const error = log.failed_reason || log.error_message;
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

  return {
    totalSMS,
    delivered,
    failed,
    pending,
    deliveryRate,
    failureRate,
    errorCounts,
  };
}

async function sendAdminNotification(alert: Alert, supabase: any) {
  try {
    console.log('Sending admin notification for alert:', alert.alert_type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Call the send-admin-notification function
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
          title: alert.title,
          message: alert.description,
          priority: alert.severity === 'critical' ? 'high' : 'medium',
          metadata: {
            alert_id: alert.alert_type,
            metric_value: alert.metric_value,
            threshold_value: alert.threshold_value,
            ...alert.metadata,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send admin notification:', errorText);
    } else {
      const result = await response.json();
      console.log('Admin notification sent successfully:', result);
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}
