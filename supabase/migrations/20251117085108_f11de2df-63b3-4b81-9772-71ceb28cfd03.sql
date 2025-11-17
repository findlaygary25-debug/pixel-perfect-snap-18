-- Create notification template tables

-- Supported languages table
CREATE TABLE IF NOT EXISTS public.supported_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rtl BOOLEAN DEFAULT false
);

-- Insert common languages
INSERT INTO public.supported_languages (code, name, native_name, is_active, rtl) VALUES
  ('en', 'English', 'English', true, false),
  ('es', 'Spanish', 'Español', true, false),
  ('fr', 'French', 'Français', true, false),
  ('de', 'German', 'Deutsch', true, false),
  ('it', 'Italian', 'Italiano', true, false),
  ('pt', 'Portuguese', 'Português', true, false),
  ('zh', 'Chinese', '中文', true, false),
  ('ja', 'Japanese', '日本語', true, false),
  ('ar', 'Arabic', 'العربية', true, true),
  ('hi', 'Hindi', 'हिन्दी', true, false)
ON CONFLICT (code) DO NOTHING;

-- Notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  default_language TEXT DEFAULT 'en' REFERENCES public.supported_languages(code),
  available_channels TEXT[] DEFAULT ARRAY['email', 'sms', 'in_app'],
  variables JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notification template content table
CREATE TABLE IF NOT EXISTS public.notification_template_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES public.supported_languages(code),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  subject TEXT,
  content_blocks JSONB DEFAULT '[]'::jsonb,
  plain_text TEXT,
  preview_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, language_code, channel)
);

-- Notification template versions table
CREATE TABLE IF NOT EXISTS public.notification_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL,
  changed_by UUID,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_template_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_templates
CREATE POLICY "Admins can manage templates"
  ON public.notification_templates
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active templates"
  ON public.notification_templates
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for notification_template_content
CREATE POLICY "Admins can manage template content"
  ON public.notification_template_content
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active template content"
  ON public.notification_template_content
  FOR SELECT
  USING (template_id IN (SELECT id FROM public.notification_templates WHERE is_active = true));

-- RLS Policies for notification_template_versions
CREATE POLICY "Admins can view template versions"
  ON public.notification_template_versions
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert template versions"
  ON public.notification_template_versions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for supported_languages
CREATE POLICY "Anyone can view active languages"
  ON public.supported_languages
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage languages"
  ON public.supported_languages
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX idx_notification_templates_active ON public.notification_templates(is_active);
CREATE INDEX idx_notification_template_content_template ON public.notification_template_content(template_id);
CREATE INDEX idx_notification_template_content_language ON public.notification_template_content(language_code);
CREATE INDEX idx_notification_template_versions_template ON public.notification_template_versions(template_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_template_updated_at();

CREATE TRIGGER update_notification_template_content_updated_at
  BEFORE UPDATE ON public.notification_template_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_template_updated_at();