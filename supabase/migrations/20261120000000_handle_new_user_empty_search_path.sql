-- handle_new_user only uses schema-qualified names (public.profiles,
-- public.user_progress), so it can run with an empty search_path, which is
-- stricter than "public, pg_temp" set in 20261119000000_security_hardening.sql:
-- no object can be shadowed through the search path of a SECURITY DEFINER
-- function. schema.sql already declares the same setting for fresh installs.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
