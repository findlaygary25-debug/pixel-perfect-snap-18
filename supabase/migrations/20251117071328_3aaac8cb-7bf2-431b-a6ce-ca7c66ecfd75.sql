-- Add SMS delivery tracking columns to notification_delivery_logs
ALTER TABLE notification_delivery_logs 
  ADD COLUMN IF NOT EXISTS delivery_status TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS failed_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP WITH TIME ZONE;

-- Add index for quick lookups by external_id (Twilio MessageSid)
CREATE INDEX IF NOT EXISTS idx_notification_logs_external_id 
  ON notification_delivery_logs(external_id) 
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN notification_delivery_logs.delivery_status IS 'Detailed Twilio delivery status: queued, sent, delivered, undelivered, failed, read';
COMMENT ON COLUMN notification_delivery_logs.delivered_at IS 'Timestamp when message was confirmed delivered by Twilio';
COMMENT ON COLUMN notification_delivery_logs.failed_reason IS 'Twilio error code or description if delivery failed';
COMMENT ON COLUMN notification_delivery_logs.last_status_update IS 'Last time webhook updated this record';