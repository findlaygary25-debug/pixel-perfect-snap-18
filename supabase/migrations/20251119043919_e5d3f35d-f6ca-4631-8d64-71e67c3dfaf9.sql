-- Fix function search_path mutability by setting a fixed search_path for the escalation config trigger
CREATE OR REPLACE FUNCTION public.update_escalation_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;