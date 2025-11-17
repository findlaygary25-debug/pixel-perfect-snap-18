-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
DROP FUNCTION IF EXISTS public.create_default_notification_preferences();
DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON public.user_notification_preferences;
DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;

-- Create user notification preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Notification type preferences
  flash_sales_email BOOLEAN NOT NULL DEFAULT true,
  flash_sales_sms BOOLEAN NOT NULL DEFAULT false,
  flash_sales_in_app BOOLEAN NOT NULL DEFAULT true,
  
  challenges_email BOOLEAN NOT NULL DEFAULT true,
  challenges_sms BOOLEAN NOT NULL DEFAULT false,
  challenges_in_app BOOLEAN NOT NULL DEFAULT true,
  
  follows_email BOOLEAN NOT NULL DEFAULT false,
  follows_sms BOOLEAN NOT NULL DEFAULT false,
  follows_in_app BOOLEAN NOT NULL DEFAULT true,
  
  comments_email BOOLEAN NOT NULL DEFAULT false,
  comments_sms BOOLEAN NOT NULL DEFAULT false,
  comments_in_app BOOLEAN NOT NULL DEFAULT true,
  
  shares_email BOOLEAN NOT NULL DEFAULT false,
  shares_sms BOOLEAN NOT NULL DEFAULT false,
  shares_in_app BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create default preferences when user signs up
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();