-- Non-destructive hardening for databases already initialized with schema.sql.
-- All relations used by this SECURITY DEFINER trigger are schema-qualified.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
