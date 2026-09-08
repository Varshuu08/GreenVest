-- Production hardening for the optional demo seed helper.
-- The browser application never calls this function. Revoke direct execution
-- from authenticated users so example records cannot be inserted into real
-- user workspaces through a public RPC call.

revoke execute on function public.seed_my_greenvest_demo_workspace() from authenticated;
revoke execute on function public.seed_my_greenvest_demo_workspace() from anon;