-- Browser ownership hardening.
-- Private records created directly from the browser derive ownership from the
-- verified Supabase session instead of accepting a client-supplied user_id.

alter table public.land_analyses
  alter column user_id set default auth.uid();

alter table public.reports
  alter column user_id set default auth.uid();