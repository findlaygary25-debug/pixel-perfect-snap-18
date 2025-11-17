-- Create notification delivery logs table
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('pending_orders', 'new_users', 'ending_sales', 'system_errors', 'high_value_orders')),
  recipient_id UUID NOT NULL,
  recipient_identifier TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  error_message TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view all logs
CREATE POLICY "Admins can view all notification logs"
  ON public.notification_delivery_logs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policy: System can insert logs
CREATE POLICY "System can insert notification logs"
  ON public.notification_delivery_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notification_logs_recipient_id ON public.notification_delivery_logs(recipient_id);
CREATE INDEX idx_notification_logs_channel ON public.notification_delivery_logs(channel);
CREATE INDEX idx_notification_logs_status ON public.notification_delivery_logs(status);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_delivery_logs(sent_at DESC);
CREATE INDEX idx_notification_logs_notification_type ON public.notification_delivery_logs(notification_type);
CREATE INDEX idx_notification_logs_channel_status ON public.notification_delivery_logs(channel, status);

-- Enable realtime for the table
ALTER TABLE public.notification_delivery_logs REPLICA IDENTITY FULL;

-- Add comment for documentation
COMMENT ON TABLE public.notification_delivery_logs IS 'Tracks all notification deliveries for compliance and debugging purposes';