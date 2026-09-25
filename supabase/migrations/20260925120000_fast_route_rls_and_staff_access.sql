-- Speed: evaluate route access once per statement, and resolve a signed-in
-- staff member's whole access state in one round trip.
--
-- 1. The route read/update policies called private.can_view_route(id) and
--    private.can_manage_route(id) for every row. Each call re-ran the staff,
--    role, section and blanket-access lookups, which cost ~0.3ms per row:
--    ~400ms for a 1,200-route list, growing with every card printed. The same
--    decision is now split into the part that depends only on the caller
--    (evaluated once, as an InitPlan) and the part that depends on the row (a
--    membership test against the caller's explicitly assigned route ids).
--    The truth table is unchanged; can_view_route/can_manage_route stay for
--    any caller that needs a single-route answer.
--
-- 2. The access gate asked four RPCs per request (is_active_staff,
--    is_password_change_required, get_my_staff_profile,
--    get_my_staff_permissions). get_my_staff_access answers all four at once.

-- Caller-only route scopes ---------------------------------------------------

-- 'all'      the caller may see/manage every route
-- 'assigned' only routes listed in private.staff_route_access
-- 'none'     no route at all
create or replace function private.route_view_scope()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not (
      private.is_staff_aal2()
      and (
        private.has_section_permission('routes', false)
        or private.has_section_permission('analytics', false)
      )
    ) then 'none'
    when private.is_superadmin() then 'all'
    when exists (
      select 1
      from private.staff_members
      where user_id = (select auth.uid())
        and active
        and all_routes_access is not null
    ) then 'all'
    else 'assigned'
  end;
$$;

create or replace function private.route_manage_scope()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not (
      private.is_staff_aal2()
      and private.has_section_permission('routes', true)
    ) then 'none'
    when private.is_superadmin() then 'all'
    when exists (
      select 1
      from private.staff_members
      where user_id = (select auth.uid())
        and active
        and all_routes_access = 'manage'
    ) then 'all'
    else 'assigned'
  end;
$$;

-- The caller's explicit per-route grants, as one array for `id = any(...)`.
create or replace function private.my_assigned_route_ids(p_manage boolean)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pg_catalog.array_agg(route_id), '{}'::uuid[])
  from private.staff_route_access
  where user_id = (select auth.uid())
    and (not p_manage or access_level = 'manage');
$$;

revoke all on function private.route_view_scope() from public, anon, authenticated;
revoke all on function private.route_manage_scope() from public, anon, authenticated;
revoke all on function private.my_assigned_route_ids(boolean) from public, anon, authenticated;
-- Policy evaluation runs as the caller, so the caller needs EXECUTE. The
-- private schema stays unexposed through the Data API.
grant execute on function private.route_view_scope() to authenticated;
grant execute on function private.route_manage_scope() to authenticated;
grant execute on function private.my_assigned_route_ids(boolean) to authenticated;

-- Route policies --------------------------------------------------------------

-- Every `(select ...)` below is uncorrelated, so Postgres runs it once per
-- statement; only the `id = any(...)` array test runs per row.
drop policy if exists "Permitted staff can read routes" on public.redirect_routes;
create policy "Permitted staff can read routes" on public.redirect_routes
  for select to authenticated
  using (
    (select private.route_view_scope()) = 'all'
    or (
      (select private.route_view_scope()) = 'assigned'
      and id = any ((select private.my_assigned_route_ids(false))::uuid[])
    )
  );

drop policy if exists "Permitted staff can update routes" on public.redirect_routes;
create policy "Permitted staff can update routes" on public.redirect_routes
  for update to authenticated
  using (
    (select private.route_manage_scope()) = 'all'
    or (
      (select private.route_manage_scope()) = 'assigned'
      and id = any ((select private.my_assigned_route_ids(true))::uuid[])
    )
  )
  with check (
    (select private.route_manage_scope()) = 'all'
    or (
      (select private.route_manage_scope()) = 'assigned'
      and id = any ((select private.my_assigned_route_ids(true))::uuid[])
    )
  );

-- One-call access state -------------------------------------------------------

-- Returns no row for an unknown or deactivated account. `permissions` follows
-- get_my_staff_permissions exactly, including its aal2 requirement, so a
-- password-only session sees an empty array.
create or replace function public.get_my_staff_access()
returns table (
  user_id uuid,
  role text,
  must_change_password boolean,
  permissions jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.user_id,
    s.role,
    s.must_change_password,
    coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'section', sections.section,
        'can_view', case
          when s.role = 'superadmin' then true
          when sections.section = 'staff' then false
          else coalesce(p.can_view, false)
        end,
        'can_manage', case
          when s.role = 'superadmin' then true
          when sections.section = 'staff' then false
          else coalesce(p.can_manage, false)
        end
      ))
      from pg_catalog.unnest(array['routes', 'analytics', 'convert', 'stories', 'orders', 'staff']::text[]) sections(section)
      left join private.staff_section_permissions p
        on p.user_id = s.user_id
       and p.section = sections.section
      where (select auth.jwt() ->> 'aal') = 'aal2'
    ), '[]'::jsonb)
  from private.staff_members s
  where s.user_id = (select auth.uid())
    and s.active;
$$;

revoke all on function public.get_my_staff_access() from public, anon;
grant execute on function public.get_my_staff_access() to authenticated;

-- Dashboard counts ------------------------------------------------------------

-- SECURITY INVOKER: counts only the routes RLS lets the caller read, in one
-- small response instead of shipping every row to the server to count.
create or replace function public.get_route_stats()
returns table (
  total bigint,
  active bigint,
  scanned bigint,
  total_scans bigint,
  google bigint,
  facebook bigint,
  instagram bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.count(*),
    pg_catalog.count(*) filter (where r.active),
    pg_catalog.count(*) filter (where r.scan_count > 0),
    coalesce(pg_catalog.sum(r.scan_count), 0)::bigint,
    pg_catalog.count(*) filter (where r.platform = 'google'),
    pg_catalog.count(*) filter (where r.platform = 'facebook'),
    pg_catalog.count(*) filter (where r.platform = 'instagram')
  from public.redirect_routes r;
$$;

revoke all on function public.get_route_stats() from public, anon;
grant execute on function public.get_route_stats() to authenticated;
