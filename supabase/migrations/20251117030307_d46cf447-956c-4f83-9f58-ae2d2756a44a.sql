-- Create notification A/B tests table
CREATE TABLE IF NOT EXISTS public.notification_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  notification_type TEXT NOT NULL, -- 'flash_sale', 'challenge', 'follow', etc.
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience JSONB DEFAULT '{}', -- targeting criteria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test variants table
CREATE TABLE IF NOT EXISTS public.notification_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.notification_ab_tests(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  message_title TEXT NOT NULL,
  message_body TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  traffic_allocation INTEGER NOT NULL DEFAULT 50, -- percentage 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test assignments table (tracks which users got which variant)
CREATE TABLE IF NOT EXISTS public.notification_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.notification_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.notification_test_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(test_id, user_id)
);

-- Create test metrics table (tracks engagement)
CREATE TABLE IF NOT EXISTS public.notification_test_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.notification_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.notification_test_variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notification_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  notification_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  conversion_event BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_test_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_ab_tests (admin only for now)
CREATE POLICY "Anyone can view active tests"
  ON public.notification_ab_tests
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create tests"
  ON public.notification_ab_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Test creators can update their tests"
  ON public.notification_ab_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for notification_test_variants
CREATE POLICY "Anyone can view variants of active tests"
  ON public.notification_test_variants
  FOR SELECT
  USING (test_id IN (SELECT id FROM public.notification_ab_tests WHERE status = 'active'));

CREATE POLICY "Authenticated users can create variants"
  ON public.notification_test_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variants"
  ON public.notification_test_variants
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for notification_test_assignments
CREATE POLICY "Users can view their own assignments"
  ON public.notification_test_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create assignments"
  ON public.notification_test_assignments
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification_test_metrics
CREATE POLICY "Users can view their own metrics"
  ON public.notification_test_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create metrics"
  ON public.notification_test_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own metrics"
  ON public.notification_test_metrics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to get A/B test results
CREATE OR REPLACE FUNCTION public.get_ab_test_results(test_id_param UUID)
RETURNS TABLE(
  variant_id UUID,
  variant_name TEXT,
  total_sent BIGINT,
  total_viewed BIGINT,
  total_clicked BIGINT,
  total_converted BIGINT,
  view_rate NUMERIC,
  click_rate NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as variant_id,
    v.variant_name,
    COUNT(m.id)::BIGINT as total_sent,
    COUNT(CASE WHEN m.notification_viewed THEN 1 END)::BIGINT as total_viewed,
    COUNT(CASE WHEN m.notification_clicked THEN 1 END)::BIGINT as total_clicked,
    COUNT(CASE WHEN m.conversion_event THEN 1 END)::BIGINT as total_converted,
    CASE 
      WHEN COUNT(m.id) > 0 
      THEN ROUND((COUNT(CASE WHEN m.notification_viewed THEN 1 END)::NUMERIC / COUNT(m.id)::NUMERIC) * 100, 2)
      ELSE 0
    END as view_rate,
    CASE 
      WHEN COUNT(m.id) > 0 
      THEN ROUND((COUNT(CASE WHEN m.notification_clicked THEN 1 END)::NUMERIC / COUNT(m.id)::NUMERIC) * 100, 2)
      ELSE 0
    END as click_rate,
    CASE 
      WHEN COUNT(m.id) > 0 
      THEN ROUND((COUNT(CASE WHEN m.conversion_event THEN 1 END)::NUMERIC / COUNT(m.id)::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM notification_test_variants v
  LEFT JOIN notification_test_metrics m ON v.id = m.variant_id
  WHERE v.test_id = test_id_param
  GROUP BY v.id, v.variant_name
  ORDER BY v.variant_name;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_test_assignments_user ON public.notification_test_assignments(user_id);
CREATE INDEX idx_test_assignments_test ON public.notification_test_assignments(test_id);
CREATE INDEX idx_test_metrics_test ON public.notification_test_metrics(test_id);
CREATE INDEX idx_test_metrics_variant ON public.notification_test_metrics(variant_id);
CREATE INDEX idx_test_metrics_user ON public.notification_test_metrics(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_notification_ab_tests_updated_at
  BEFORE UPDATE ON public.notification_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();