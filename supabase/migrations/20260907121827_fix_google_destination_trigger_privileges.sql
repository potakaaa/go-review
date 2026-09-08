-- The validation trigger originally ran as the authenticated caller. Because
-- the `private` schema is deliberately closed to application roles, its call
-- to private.is_google_review_destination() failed with SQLSTATE 42501 before
-- validation could run. Execute only this narrow trigger wrapper as its owner;
-- keep the private schema and both functions inaccessible to API roles.
--
-- PostgreSQL also fires an UPDATE OF trigger when a named column appears in the
-- SET list, even when the stored value is unchanged. The application submits
-- the complete editable row, so explicitly grandfather unchanged legacy URLs.

create or replace function private.enforce_google_review_destination()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.destination_url is not distinct from old.destination_url then
    return new;
  end if;

  if not private.is_google_review_destination(new.destination_url) then
    raise exception using
      errcode = '23514',
      message = 'destination_url must be an approved Google review URL';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_google_review_destination()
  from public, anon, authenticated;
