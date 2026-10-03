-- Static QR codes: the payload is encoded directly into the pattern, so a
-- printed code never passes through goreview.site, never expires and has no
-- scan limit. This table only remembers what was designed, for the library.
-- Additive: no changes to routes, redirects or staff membership.
create table public.static_qr_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(trim(label)) between 1 and 120),
  kind text not null check (kind in ('url', 'text', 'wifi', 'email', 'phone', 'sms')),
  -- The fields the designer edits (URL, SSID, ...), kept so a code can be reopened.
  fields jsonb not null default '{}'::jsonb check (jsonb_typeof(fields) = 'object'),
  -- The exact string encoded in the QR. Version 40 at level L holds 2953 bytes.
  content text not null check (char_length(content) between 1 and 2000),
  style jsonb not null default '{}'::jsonb check (jsonb_typeof(style) = 'object'),
  starred boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index static_qr_codes_library_idx
  on public.static_qr_codes (starred desc, updated_at desc);

alter table public.static_qr_codes enable row level security;
revoke all on table public.static_qr_codes from public, anon;
grant select, insert, update, delete on table public.static_qr_codes to authenticated;

-- QR codes sit with routes: whoever may view routes sees the library, whoever
-- may manage routes designs and deletes codes.
create policy "Permitted staff can read static QR codes" on public.static_qr_codes
  for select to authenticated
  using ((select private.has_section_permission('routes', false)));

create policy "Permitted staff can manage static QR codes" on public.static_qr_codes
  for all to authenticated
  using ((select private.has_section_permission('routes', true)))
  with check ((select private.has_section_permission('routes', true)));
