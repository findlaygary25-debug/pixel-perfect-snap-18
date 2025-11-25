-- Create system_settings table for admin-managed configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Everyone can view settings (for validation)
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);

-- Insert default upload settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('upload_max_file_size_mb', '100', 'Maximum upload file size in MB'),
  ('upload_max_video_duration_seconds', '300', 'Maximum video duration in seconds'),
  ('upload_allowed_video_types', '["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"]', 'Allowed video MIME types')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();