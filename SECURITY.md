# Security operations

Review Routes contains client business names, Google destinations, optional
operator notes, and aggregate scan counts. It does not intentionally collect
reviewer identities, IP addresses, user agents, or per-scan event records.

## Access model

- Supabase Auth accounts are created manually. Public sign-up stays disabled.
- An Auth account is not sufficient: its UUID must also be active in
  `private.staff_members`.
- Every dashboard session must reach Authenticator Assurance Level 2 using a
  verified TOTP factor.
- Approved staff share the same route inventory. Anonymous users can execute
  only the exact-slug `resolve_redirect(text)` RPC; they cannot select the
  underlying table.
- Routes cannot be deleted. Direct clients cannot change ownership, slugs,
  batch metadata, timestamps, or scan counters.

## Staff onboarding and removal

Create the Auth user manually in Supabase, copy the user's UUID, then approve it
in SQL Editor:

```sql
insert into private.staff_members (user_id, created_by)
values ('USER_UUID', 'YOUR_USER_UUID')
on conflict (user_id) do update set active = true;
```

On first sign-in, the app requires the staff member to scan a TOTP QR code and
verify a six-digit code before opening the dashboard.

To remove access immediately:

```sql
update private.staff_members
set active = false
where user_id = 'USER_UUID';
```

Then revoke the user's sessions or delete the Auth user in the Supabase
dashboard. Do both: the allowlist is the authorization boundary, while session
revocation shortens incident response time.

## Password recovery

Use `/forgot-password` and open the emailed link in the same browser that made
the request. The recovery response is deliberately identical for registered and
unregistered addresses. The callback exchanges the one-time PKCE code for a
cookie session, `/reset-password` requires that authenticated session, and a
successful password change globally signs out the account before returning to
login. Do not set or send staff passwords through chat or support messages.

## Production rollout order

For the existing production project, deploy in this order to avoid breaking
printed routes or locking out staff:

1. Apply `20260906141216_security_foundations.sql`.
2. Deploy the application containing `/mfa` and the anonymous redirect RPC.
3. Sign in and complete TOTP enrollment; verify one dashboard read and one
   public redirect.
4. Apply `20260906142014_enforce_staff_mfa.sql`.
5. Remove `SUPABASE_SERVICE_ROLE_KEY` from every Vercel environment and
   redeploy if an older deployment could still reference it.

New environments can apply all migrations before first sign-in, provided the
new Auth user's UUID is inserted into `private.staff_members` through SQL Editor.

## Data and destination controls

- New or changed destinations must be approved HTTPS Google Maps/Review URLs in
  both application validation and a database trigger.
- Legacy non-Google destinations remain readable and redirectable. Editing
  their destination requires replacing it with an approved Google URL.
- User-facing errors are generic; server logs retain only operation labels and
  database error codes, never passwords, TOTP secrets, or raw client records.
- `private.route_audit_events` records route inserts and user-managed field
  changes. It is not exposed through the Data API.

## Incident response

If an account or secret may be compromised:

1. Deactivate the staff UUID and revoke its Auth sessions.
2. Rotate the affected Supabase/Vercel credentials. The application should not
   need a service-role key.
3. Review Auth logs, Vercel logs, and `private.route_audit_events` for the
   suspected window.
4. Validate every changed destination before reactivating access.
5. Record the event, scope, actions, and follow-up owner without copying client
   data or secrets into the incident note.

## Routine review

Quarterly, confirm the Auth user list matches active staff, all staff have a
verified TOTP factor, public sign-up remains disabled, Vercel has no service-role
secret, dependency and database security advisors are clean, and production
headers still include CSP, HSTS, no-sniff, no-referrer, and frame denial.

The current project intentionally has no usable database backup or point-in-time
recovery window. That is an accepted availability and recovery risk, not a
security control; reassess it before client volume or stored data grows.
