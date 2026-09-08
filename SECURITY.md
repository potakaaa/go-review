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
- There are two roles: `superadmin` and `admin`. The superadmin can manage
  staff, assign access, and publish routes. Admins can only use the sections and
  route assignments granted to them.
- Section permissions cover `routes`, `analytics`, `convert`, `stories`, and
  `staff`. The `staff` section is reserved for superadmins in the application
  and database functions.
- Route assignments are `view` or `manage`. A route manager must have both the
  route assignment and `routes.can_manage`; analytics access is separate from
  access to route detail pages.
- Routes created by a regular admin are forced to `draft` and inactive. Only a
  superadmin can publish them. Existing active staff retain the pre-RBAC shared
  route inventory when the migration is applied.
- Anonymous users can execute only the exact-slug `resolve_redirect(text)` RPC;
  they cannot select the underlying table.
- Routes cannot be deleted. Direct clients cannot change ownership, slugs,
  batch metadata, timestamps, or scan counters.

## Staff onboarding and removal

Apply `20260908102400_multi_admin_rbac.sql`, confirm the owner's row in
`private.staff_members` has `role = 'superadmin'`, and configure the server-only
`SUPABASE_SERVICE_ROLE_KEY`. Then the superadmin can use **Dashboard → Staff**:

1. Enter the email and a temporary password.
2. Select `admin` or `superadmin`.
3. Select section view/manage permissions and route-level `view`/`manage`
   assignments.
4. Give the temporary password to the person through a secure channel.

The server action creates and confirms the Auth user, writes the staff profile
and permissions through a superadmin-only RPC, and marks the account as needing
a password change. The service-role key is never sent to the browser. The new
staff member must change that password and complete TOTP enrollment before
using the dashboard.

To suspend access immediately, uncheck **Active** in the staff editor. Database
RLS, proxy checks, and server-side permission checks all consult that flag, so
new requests lose access immediately. Also revoke the user's Auth sessions or
delete the Auth user in the Supabase dashboard to shorten incident response
time; those are separate session-management actions.

For an emergency SQL-only suspension:

```sql
update private.staff_members
set active = false
where user_id = 'USER_UUID';
```

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
5. Apply `20260908102400_multi_admin_rbac.sql` and verify the owner remains an
   active `superadmin`. Existing active staff are seeded with full section
   permissions and access to the existing route inventory during this migration.
6. Add `SUPABASE_SERVICE_ROLE_KEY` only to the server environment, deploy the
   application containing the Staff screen, and verify one staff listing and
   one permission-restricted account before creating additional admins.

Do not deploy the new application before the RBAC migration: it calls the new
profile and permission RPCs. Do not put the service-role key in any
`NEXT_PUBLIC_*` variable or browser bundle.

New environments can apply all migrations before first sign-in, provided the
first Auth user's UUID is inserted into `private.staff_members` as an active
`superadmin` through SQL Editor.

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
2. Rotate the affected Supabase/Vercel credentials, including the
   `SUPABASE_SERVICE_ROLE_KEY` if the server environment may have been exposed.
3. Remove the affected account's route assignments and review staff audit
   events after containment.
4. Review Auth logs, Vercel logs, and `private.route_audit_events` for the
   suspected window.
5. Validate every changed destination before reactivating access.
6. Record the event, scope, actions, and follow-up owner without copying client
   data or secrets into the incident note.

## Routine review

Quarterly, confirm the Auth user list matches active staff, all staff have a
verified TOTP factor, public sign-up remains disabled, the service-role secret
exists only in the server environment, permission assignments are still
appropriate, dependency and database security advisors are clean, and production
headers still include CSP, HSTS, no-sniff, no-referrer, and frame denial.

The current project intentionally has no usable database backup or point-in-time
recovery window. That is an accepted availability and recovery risk, not a
security control; reassess it before client volume or stored data grows.
