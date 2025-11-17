-- Add escalation tracking columns to delivery_alerts
ALTER TABLE delivery_alerts
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS escalated_to TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS escalation_history JSONB DEFAULT '[]'::jsonb;

-- Create escalation configuration table
CREATE TABLE IF NOT EXISTS alert_escalation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low' or specific types
  escalation_level INTEGER NOT NULL, -- 0, 1, 2, etc.
  time_threshold_minutes INTEGER NOT NULL, -- Minutes before escalation
  target_role TEXT NOT NULL, -- 'admin', 'moderator', etc.
  notification_channels TEXT[] DEFAULT ARRAY['email', 'sms', 'in_app'], -- Channels to use
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(alert_type, escalation_level)
);

-- Add RLS policies for escalation config
ALTER TABLE alert_escalation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view escalation config"
  ON alert_escalation_config
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage escalation config"
  ON alert_escalation_config
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default escalation rules
INSERT INTO alert_escalation_config (alert_type, escalation_level, time_threshold_minutes, target_role, notification_channels)
VALUES 
  -- Critical alerts escalate quickly
  ('critical', 0, 0, 'admin', ARRAY['email', 'sms', 'in_app']), -- Immediate to all admins
  ('critical', 1, 15, 'admin', ARRAY['email', 'sms']), -- After 15 min, re-notify with urgency
  ('critical', 2, 30, 'admin', ARRAY['email', 'sms', 'in_app']), -- After 30 min, escalate to all channels
  
  -- High severity alerts escalate moderately
  ('high', 0, 0, 'admin', ARRAY['email', 'in_app']), -- Immediate to admins
  ('high', 1, 30, 'admin', ARRAY['email', 'sms']), -- After 30 min, add SMS
  ('high', 2, 60, 'admin', ARRAY['email', 'sms', 'in_app']), -- After 1 hour, full escalation
  
  -- Medium severity alerts escalate slowly
  ('medium', 0, 0, 'admin', ARRAY['in_app']), -- Immediate in-app only
  ('medium', 1, 60, 'admin', ARRAY['email', 'in_app']), -- After 1 hour, add email
  ('medium', 2, 120, 'admin', ARRAY['email', 'sms', 'in_app']) -- After 2 hours, full escalation
ON CONFLICT (alert_type, escalation_level) DO NOTHING;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_delivery_alerts_escalation_level ON delivery_alerts(escalation_level);
CREATE INDEX IF NOT EXISTS idx_delivery_alerts_escalated_at ON delivery_alerts(escalated_at);
CREATE INDEX IF NOT EXISTS idx_alert_escalation_config_type_level ON alert_escalation_config(alert_type, escalation_level);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_escalation_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_escalation_config_timestamp
  BEFORE UPDATE ON alert_escalation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_escalation_config_updated_at();

COMMENT ON TABLE alert_escalation_config IS 'Defines escalation rules for alerts based on severity and time';
COMMENT ON COLUMN delivery_alerts.escalation_level IS 'Current escalation level (0 = initial, 1+ = escalated)';
COMMENT ON COLUMN delivery_alerts.escalated_at IS 'Last escalation timestamp';
COMMENT ON COLUMN delivery_alerts.escalated_to IS 'Array of admin user IDs who received escalation notifications';
COMMENT ON COLUMN delivery_alerts.escalation_history IS 'JSON array tracking escalation timeline';