-- Blanket route access for staff, plus the reads the access picker needs.
--
-- Until now a route grant was one row per (staff, route) in
-- private.staff_route_access. An admin who looks after the whole inventory had
-- to be granted every route by hand, and a route created afterwards reached
-- nobody until a superadmin revisited each account. `all_routes_access` states
-- that intent once: null keeps the explicit per-route list, 'view' or 'manage'
-- covers every route including ones created later.
--
-- Authorization stays database-backed: the new column is read by
-- private.has_route_access, so every RLS policy that already calls
-- can_view_route/can_manage_route honours it without further change.

alter table private.staff_members
  add column all_routes_access text
    check (all_routes_access in ('view', 'manage'));

comment on column private.staff_members.all_routes_access is
  'null = only the routes listed in private.staff_route_access; otherwise this level applies to every route, including routes created later.';

-- Deliberately not backfilled. The 2026-08-08 RBAC migration granted existing
-- staff every route that existed at that moment; promoting those grants to
-- "all routes" here would silently widen them to future routes.

-- Authorization helper --------------------------------------------------------

create or replace function private.has_route_access(
  p_route_id uuid,
  p_manage boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff_aal2()
    and (
      private.is_superadmin()
      or exists (
        select 1
        from private.staff_members
        where user_id = (select auth.uid())
          and active
          and all_routes_access is not null
          and (not p_manage or all_routes_access = 'manage')
      )
      or exists (
        select 1
        from private.staff_route_access
        where user_id = (select auth.uid())
          and route_id = p_route_id
          and (not p_manage or access_level = 'manage')
      )
    );
$$;

revoke all on function private.has_route_access(uuid, boolean) from public, anon, authenticated;

-- Superadmin reads ------------------------------------------------------------

drop function if exists public.admin_list_staff();

create or replace function public.admin_list_staff()
returns table (
  user_id uuid,
  email text,
  role text,
  active boolean,
  must_change_password boolean,
  all_routes_access text,
  created_at timestamptz,
  created_by uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  return query
    select s.user_id, u.email::text, s.role, s.active,
      s.must_change_password, s.all_routes_access, s.created_at, s.created_by
    from private.staff_members s
    join auth.users u on u.id = s.user_id
    order by s.active desc, s.created_at asc;
end;
$$;

-- Every staff member's route grants in one read. The access picker offers
-- "copy access from an existing staff member", which would otherwise be one
-- admin_list_route_access call per account on the roster.
create or replace function public.admin_list_all_route_access()
returns table (
  user_id uuid,
  route_id uuid,
  access_level text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  return query
    select a.user_id, a.route_id, a.access_level
    from private.staff_route_access a
    order by a.user_id, a.route_id;
end;
$$;

revoke all on function public.admin_list_staff() from public, anon;
revoke all on function public.admin_list_all_route_access() from public, anon;
grant execute on function public.admin_list_staff() to authenticated;
grant execute on function public.admin_list_all_route_access() to authenticated;

-- Superadmin writes -----------------------------------------------------------

-- Replaced rather than overloaded: PostgREST resolves an RPC by argument name,
-- so leaving the four-argument form in place would make the call ambiguous.
drop function if exists public.admin_register_staff(uuid, text, jsonb, jsonb);
drop function if exists public.admin_update_staff(uuid, text, boolean, jsonb, jsonb);

create or replace function private.validate_all_routes_access(p_all_routes_access text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_all_routes_access is not null
     and p_all_routes_access not in ('view', 'manage') then
    raise exception using errcode = '22023', message = 'Invalid blanket route access';
  end if;
end;
$$;

revoke all on function private.validate_all_routes_access(text) from public, anon, authenticated;

create or replace function public.admin_register_staff(
  p_user_id uuid,
  p_role text,
  p_permissions jsonb default '[]'::jsonb,
  p_route_access jsonb default '[]'::jsonb,
  p_all_routes_access text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  blanket_access text;
begin
  perform private.require_superadmin();
  if p_role not in ('admin', 'superadmin') then
    raise exception using errcode = '22023', message = 'Invalid staff role';
  end if;
  perform private.validate_permission_payload(p_permissions);
  perform private.validate_route_access_payload(p_route_access);
  perform private.validate_all_routes_access(p_all_routes_access);
  if p_role = 'admin' and exists (
    select 1
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' = 'staff'
  ) then
    raise exception using errcode = '42501', message = 'Staff permission is superadmin-only';
  end if;

  -- A superadmin already reaches every route through private.is_superadmin();
  -- storing a blanket level as well would leave two sources of truth to keep
  -- in step when the account is later demoted.
  blanket_access := case when p_role = 'superadmin' then null else p_all_routes_access end;

  insert into private.staff_members (
    user_id, role, active, must_change_password, all_routes_access, created_by
  )
  values (p_user_id, p_role, true, true, blanket_access, (select auth.uid()));

  if p_role = 'superadmin' then
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id, section, true, true, (select auth.uid())
    from unnest(array['routes', 'analytics', 'convert', 'stories', 'orders', 'staff']::text[]) as section
    on conflict (user_id, section) do update
      set can_view = true, can_manage = true, updated_by = (select auth.uid()), updated_at = pg_catalog.now();
  else
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id,
      value->>'section',
      coalesce((value->>'can_view')::boolean, false),
      coalesce((value->>'can_manage')::boolean, false),
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value;
  end if;

  -- Blanket access supersedes the per-route list; keeping both would let a
  -- stale row outlive the switch back to explicit grants.
  if p_role = 'admin' and blanket_access is null then
    insert into private.staff_route_access (user_id, route_id, access_level, created_by)
    select p_user_id,
      (value->>'route_id')::uuid,
      value->>'access_level',
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_route_access, '[]'::jsonb)) value;
  end if;

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_permissions_replaced',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_routes_replaced',
    pg_catalog.jsonb_build_object(
      'all_routes_access', blanket_access,
      'assignment_count', case
        when blanket_access is not null then 0
        else pg_catalog.jsonb_array_length(coalesce(p_route_access, '[]'::jsonb))
      end
    )
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_registered',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  return true;
end;
$$;

create or replace function public.admin_update_staff(
  p_user_id uuid,
  p_role text,
  p_active boolean,
  p_permissions jsonb default '[]'::jsonb,
  p_route_access jsonb default '[]'::jsonb,
  p_all_routes_access text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_role text;
  blanket_access text;
begin
  perform private.require_superadmin();
  if p_user_id = (select auth.uid()) then
    raise exception using errcode = '42501', message = 'You cannot change your own superadmin access';
  end if;
  if p_role not in ('admin', 'superadmin') then
    raise exception using errcode = '22023', message = 'Invalid staff role';
  end if;
  perform private.validate_permission_payload(p_permissions);
  perform private.validate_route_access_payload(p_route_access);
  perform private.validate_all_routes_access(p_all_routes_access);
  if p_role = 'admin' and exists (
    select 1
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' = 'staff'
  ) then
    raise exception using errcode = '42501', message = 'Staff permission is superadmin-only';
  end if;

  select role into previous_role
  from private.staff_members
  where user_id = p_user_id;
  if previous_role is null then
    raise exception using errcode = 'P0002', message = 'Staff member not found';
  end if;

  if previous_role = 'superadmin' and (p_role <> 'superadmin' or not p_active)
     and (select count(*) from private.staff_members where role = 'superadmin' and active) <= 1 then
    raise exception using errcode = '42501', message = 'At least one active superadmin is required';
  end if;

  blanket_access := case when p_role = 'superadmin' then null else p_all_routes_access end;

  update private.staff_members
  set role = p_role,
      active = p_active,
      all_routes_access = blanket_access
  where user_id = p_user_id;

  delete from private.staff_section_permissions where user_id = p_user_id;
  delete from private.staff_route_access where user_id = p_user_id;

  if p_role = 'superadmin' then
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id, section, true, true, (select auth.uid())
    from unnest(array['routes', 'analytics', 'convert', 'stories', 'orders', 'staff']::text[]) as section;
  else
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id,
      value->>'section',
      coalesce((value->>'can_view')::boolean, false),
      coalesce((value->>'can_manage')::boolean, false),
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value;

    if blanket_access is null then
      insert into private.staff_route_access (user_id, route_id, access_level, created_by)
      select p_user_id,
        (value->>'route_id')::uuid,
        value->>'access_level',
        (select auth.uid())
      from jsonb_array_elements(coalesce(p_route_access, '[]'::jsonb)) value;
    end if;
  end if;

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_permissions_replaced',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_routes_replaced',
    pg_catalog.jsonb_build_object(
      'all_routes_access', blanket_access,
      'assignment_count', case
        when blanket_access is not null then 0
        else pg_catalog.jsonb_array_length(coalesce(p_route_access, '[]'::jsonb))
      end
    )
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_updated',
    pg_catalog.jsonb_build_object('role', p_role, 'active', p_active)
  );
  return true;
end;
$$;

revoke all on function public.admin_register_staff(uuid, text, jsonb, jsonb, text) from public, anon;
revoke all on function public.admin_update_staff(uuid, text, boolean, jsonb, jsonb, text) from public, anon;
grant execute on function public.admin_register_staff(uuid, text, jsonb, jsonb, text) to authenticated;
grant execute on function public.admin_update_staff(uuid, text, boolean, jsonb, jsonb, text) to authenticated;
