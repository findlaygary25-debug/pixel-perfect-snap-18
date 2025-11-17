-- Create admin notification preferences table
CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Alert type preferences (in-app)
  pending_orders_in_app BOOLEAN NOT NULL DEFAULT true,
  new_users_in_app BOOLEAN NOT NULL DEFAULT true,
  ending_sales_in_app BOOLEAN NOT NULL DEFAULT true,
  system_errors_in_app BOOLEAN NOT NULL DEFAULT true,
  high_value_orders_in_app BOOLEAN NOT NULL DEFAULT true,
  
  -- Alert type preferences (email)
  pending_orders_email BOOLEAN NOT NULL DEFAULT true,
  new_users_email BOOLEAN NOT NULL DEFAULT false,
  ending_sales_email BOOLEAN NOT NULL DEFAULT true,
  system_errors_email BOOLEAN NOT NULL DEFAULT true,
  high_value_orders_email BOOLEAN NOT NULL DEFAULT true,
  
  -- Alert type preferences (SMS)
  pending_orders_sms BOOLEAN NOT NULL DEFAULT false,
  new_users_sms BOOLEAN NOT NULL DEFAULT false,
  ending_sales_sms BOOLEAN NOT NULL DEFAULT false,
  system_errors_sms BOOLEAN NOT NULL DEFAULT true,
  high_value_orders_sms BOOLEAN NOT NULL DEFAULT true,
  
  -- Thresholds
  high_value_order_threshold NUMERIC DEFAULT 1000,
  
  -- Contact info for notifications
  notification_email TEXT,
  notification_phone TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage their own preferences
CREATE POLICY "Admins can view their own preferences"
ON public.admin_notification_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND is_admin(auth.uid()));

CREATE POLICY "Admins can insert their own preferences"
ON public.admin_notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_admin(auth.uid()));

CREATE POLICY "Admins can update their own preferences"
ON public.admin_notification_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_admin(auth.uid()));

-- Create trigger to update updated_at
CREATE TRIGGER update_admin_notification_preferences_updated_at
BEFORE UPDATE ON public.admin_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.admin_notification_preferences TO authenticated;