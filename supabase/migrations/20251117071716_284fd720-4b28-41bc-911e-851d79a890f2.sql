-- Create delivery alerts tracking table
CREATE TABLE IF NOT EXISTS delivery_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'low_delivery_rate', 'error_pattern', 'sudden_drop', 'high_failure_rate'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  affected_period_start TIMESTAMP WITH TIME ZONE,
  affected_period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE delivery_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all delivery alerts"
  ON delivery_alerts
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert delivery alerts"
  ON delivery_alerts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update delivery alerts"
  ON delivery_alerts
  FOR UPDATE
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_delivery_alerts_created_at ON delivery_alerts(created_at DESC);
CREATE INDEX idx_delivery_alerts_alert_type ON delivery_alerts(alert_type);
CREATE INDEX idx_delivery_alerts_resolved ON delivery_alerts(resolved) WHERE NOT resolved;
CREATE INDEX idx_delivery_alerts_severity ON delivery_alerts(severity);

COMMENT ON TABLE delivery_alerts IS 'Tracks automated SMS delivery alerts and anomalies';
COMMENT ON COLUMN delivery_alerts.alert_type IS 'Type of alert: low_delivery_rate, error_pattern, sudden_drop, high_failure_rate';
COMMENT ON COLUMN delivery_alerts.severity IS 'Alert severity level for prioritization';
COMMENT ON COLUMN delivery_alerts.metric_value IS 'The actual metric value that triggered the alert';
COMMENT ON COLUMN delivery_alerts.threshold_value IS 'The threshold that was exceeded';