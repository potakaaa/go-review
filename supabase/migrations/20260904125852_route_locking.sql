-- Protect established business routes from accidental edits. New routes are
-- unlocked by default so the existing create flow remains unchanged.
alter table public.redirect_routes
  add column locked boolean not null default false;

-- A lock is an admin-editable state, so it should refresh updated_at just like
-- the other dashboard settings while scan-count bumps remain excluded.
drop trigger if exists redirect_routes_set_updated_at on public.redirect_routes;
create trigger redirect_routes_set_updated_at
  before update on public.redirect_routes
  for each row
  when (
    old.business_name     is distinct from new.business_name
    or old.destination_url is distinct from new.destination_url
    or old.notes           is distinct from new.notes
    or old.active          is distinct from new.active
    or old.slug            is distinct from new.slug
    or old.locked          is distinct from new.locked
  )
  execute function public.set_updated_at();
