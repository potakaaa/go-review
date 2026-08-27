-- Harden the trigger function against search_path changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- Evaluate auth.uid() once per statement instead of once per row.
drop policy if exists "Owners can read their routes" on public.redirect_routes;
create policy "Owners can read their routes"
  on public.redirect_routes for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can create their routes" on public.redirect_routes;
create policy "Owners can create their routes"
  on public.redirect_routes for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update their routes" on public.redirect_routes;
create policy "Owners can update their routes"
  on public.redirect_routes for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
