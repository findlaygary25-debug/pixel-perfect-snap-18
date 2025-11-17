-- Create function to get notification preferences statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS TABLE(
  total_users BIGINT,
  email_enabled_count BIGINT,
  sms_enabled_count BIGINT,
  in_app_enabled_count BIGINT,
  flash_sales_email_count BIGINT,
  flash_sales_in_app_count BIGINT,
  flash_sales_sms_count BIGINT,
  challenges_email_count BIGINT,
  challenges_in_app_count BIGINT,
  challenges_sms_count BIGINT,
  follows_email_count BIGINT,
  follows_in_app_count BIGINT,
  follows_sms_count BIGINT,
  comments_email_count BIGINT,
  comments_in_app_count BIGINT,
  comments_sms_count BIGINT,
  shares_email_count BIGINT,
  shares_in_app_count BIGINT,
  shares_sms_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    COUNT(CASE WHEN email_enabled = true THEN 1 END)::BIGINT as email_enabled_count,
    COUNT(CASE WHEN sms_enabled = true THEN 1 END)::BIGINT as sms_enabled_count,
    COUNT(CASE WHEN in_app_enabled = true THEN 1 END)::BIGINT as in_app_enabled_count,
    COUNT(CASE WHEN flash_sales_email = true THEN 1 END)::BIGINT as flash_sales_email_count,
    COUNT(CASE WHEN flash_sales_in_app = true THEN 1 END)::BIGINT as flash_sales_in_app_count,
    COUNT(CASE WHEN flash_sales_sms = true THEN 1 END)::BIGINT as flash_sales_sms_count,
    COUNT(CASE WHEN challenges_email = true THEN 1 END)::BIGINT as challenges_email_count,
    COUNT(CASE WHEN challenges_in_app = true THEN 1 END)::BIGINT as challenges_in_app_count,
    COUNT(CASE WHEN challenges_sms = true THEN 1 END)::BIGINT as challenges_sms_count,
    COUNT(CASE WHEN follows_email = true THEN 1 END)::BIGINT as follows_email_count,
    COUNT(CASE WHEN follows_in_app = true THEN 1 END)::BIGINT as follows_in_app_count,
    COUNT(CASE WHEN follows_sms = true THEN 1 END)::BIGINT as follows_sms_count,
    COUNT(CASE WHEN comments_email = true THEN 1 END)::BIGINT as comments_email_count,
    COUNT(CASE WHEN comments_in_app = true THEN 1 END)::BIGINT as comments_in_app_count,
    COUNT(CASE WHEN comments_sms = true THEN 1 END)::BIGINT as comments_sms_count,
    COUNT(CASE WHEN shares_email = true THEN 1 END)::BIGINT as shares_email_count,
    COUNT(CASE WHEN shares_in_app = true THEN 1 END)::BIGINT as shares_in_app_count,
    COUNT(CASE WHEN shares_sms = true THEN 1 END)::BIGINT as shares_sms_count
  FROM user_notification_preferences;
END;
$$;