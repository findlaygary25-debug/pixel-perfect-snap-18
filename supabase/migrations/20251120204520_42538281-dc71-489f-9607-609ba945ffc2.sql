-- Create table to log all AI monitoring actions
CREATE TABLE IF NOT EXISTS public.ai_monitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL, -- 'content_moderation', 'data_fix', 'error_detection'
  target_table TEXT,
  target_id TEXT,
  issue_detected TEXT,
  action_taken TEXT,
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  auto_fixed BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_monitor_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view AI monitor logs"
  ON public.ai_monitor_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- System can insert logs
CREATE POLICY "System can insert AI monitor logs"
  ON public.ai_monitor_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_ai_monitor_logs_created_at ON public.ai_monitor_logs(created_at DESC);
CREATE INDEX idx_ai_monitor_logs_action_type ON public.ai_monitor_logs(action_type);
CREATE INDEX idx_ai_monitor_logs_severity ON public.ai_monitor_logs(severity);

-- Add flagged column to comments for moderation tracking
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;