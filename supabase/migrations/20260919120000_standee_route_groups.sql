-- Standees: one physical stand carrying 2-4 QR codes for one business.
--
-- A standee is deliberately *not* a new kind of row. It is a group of ordinary
-- routes, so every existing guarantee -- the permanent slug, the platform
-- destination trigger, per-route scan counts, locking, publication and the
-- audit trail -- applies to each QR on the stand without being reimplemented.
alter table public.redirect_routes
  add column standee_key text,
  add column standee_position integer;

alter table public.redirect_routes
  add constraint redirect_routes_standee_key_format
    check (standee_key is null or standee_key ~ '^[A-Za-z0-9]{7}$'),
  add constraint redirect_routes_standee_position_range
    check (standee_position is null or standee_position between 1 and 4),
  add constraint redirect_routes_standee_pair
    check ((standee_key is null) = (standee_position is null));

-- One QR per slot on a stand. The slug index remains the final guard against
-- any URL collision.
create unique index redirect_routes_standee_position_key
  on public.redirect_routes (standee_key, standee_position)
  where standee_key is not null;

create index redirect_routes_standee_key_idx
  on public.redirect_routes (standee_key)
  where standee_key is not null;

-- Insert only, matching batch_key: which stand a QR belongs to is decided when
-- the stand is printed and can never be reassigned afterwards.
grant insert (standee_key, standee_position)
  on public.redirect_routes to authenticated;
