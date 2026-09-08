-- Final access gate. Apply only after the MFA application flow is deployed and
-- every approved staff account has a verified TOTP factor.

drop policy if exists "MFA is required for route access"
  on public.redirect_routes;

create policy "MFA is required for route access"
  on public.redirect_routes
  as restrictive
  for all
  to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- The deployed redirect now uses resolve_redirect() with the anon key. Remove
-- the old service-role-only counter endpoint so it cannot drift back into use.
drop function if exists public.increment_scan_count(text);
