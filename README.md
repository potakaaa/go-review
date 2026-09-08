# Review Routes

Dynamic QR/NFC link management for physical Google Review cards.

Every card is printed once with a permanent URL — `https://goreview.rald.site/r/a7K3mP`.
That URL never changes. The Google Review page it points at is a database row you
can edit from your phone while standing in the cafe. That indirection is the whole
product: **a printed card is never wasted because a destination changed.**

- Mobile-first admin dashboard (built for 390–412px wide phones)
- Installable on iPhone from Safari with Add to Home Screen
- Supabase Auth, no public registration
- Row Level Security on every query
- 302 redirects, so destinations stay changeable forever
- Soft deactivation — routes are never deleted

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Supabase

The schema lives in `supabase/migrations/`. Apply all migrations with either:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

…or by pasting each migration file, in timestamp order, into **SQL Editor** in
the Supabase dashboard.

This creates the route table, private staff allowlist and audit trail, narrow
public redirect RPC, Google-only destination trigger, and MFA-aware RLS policies.
For the existing production project, follow the staged order in
[`SECURITY.md`](./SECURITY.md) instead of applying both security migrations at
once.

### 3. Create and approve a staff account

There is deliberately **no sign-up page**. Create your user by hand:

**Supabase dashboard → Authentication → Users → Add user**, with
*Auto Confirm User* enabled.

Copy the new user's UUID, then add it to `private.staff_members` using the
onboarding SQL in [`SECURITY.md`](./SECURITY.md). All approved staff share the
same route inventory. An Auth account that is not in the allowlist cannot enter
the workspace. Production sign-in also requires TOTP authenticator enrollment;
approved localhost sessions skip that challenge during development.

### 4. Environment

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` |
| `NEXT_PUBLIC_REDIRECT_BASE_URL` | `https://goreview.rald.site` |

The application deliberately does not use a Supabase service-role key. Public
redirects use the anon key plus an exact-slug database function, so the hosting
runtime cannot bypass RLS or enumerate client data.

> **Keep `NEXT_PUBLIC_REDIRECT_BASE_URL` set to the production origin even in
> local development.** It is what gets encoded into downloadable QR codes — point
> it at `localhost` and you can print cards nobody can ever scan. To test a
> redirect locally, just open `http://localhost:3000/r/<slug>` by hand.

### 5. Run

```bash
npm run dev
```

---

## Everyday use

1. **Create or edit a route** — paste a Google Maps share link into **Convert a
   Google Maps link** and tap **Convert link**. The direct Google review URL is
   placed into the destination field automatically, while the original Maps
   link is saved with the route. Tap **Copy link**, enter the restaurant name,
   and save. When editing later, the saved Maps link is already there to
   convert again. Leave the slug blank when creating a route and a random one
   like `a7K3mP` is generated.
2. For a print run, choose **Batch routes**, enter the shared business,
   destination and quantity, then create the batch. Routes receive numbered
   slugs such as `akfiuex-1` and `akfiuex-2`.
3. The batch screen can download every high-resolution QR as one ZIP. It also
   includes `manifest.csv`, which maps each downloaded file to its permanent
   slug. A single route still offers **Download PNG**, **SVG**, or **Copy URL**.
4. Print the card. That link is now permanent.
5. If the cafe changes its Google listing, **Edit** the destination. The slug,
   the URL and the printed QR are untouched.
6. If a cafe cancels, **Deactivate**. Scanning shows a branded "card deactivated"
   page rather than a broken link. Reactivate any time.
7. For a route that already belongs to a business, choose **Lock editing**. The
   public link and QR code keep working, but saving any edit requires typing the
   current business name. **Unlock editing** from the route screen when you need
   to make ordinary edits again.

If a staff member forgets their password, use **Forgot your password?** on the
sign-in screen. Recovery responses never disclose whether an email is registered;
the emailed link establishes a short recovery session, then all sessions are
signed out after the new password is saved.

### iPhone installation

Open the production site in Safari, tap **Share**, choose **Add to Home
Screen**, then open Review Routes from the new home-screen icon. The dashboard
is installable as a standalone app; it does not cache public `/r/*` redirects,
so a printed card always uses its current destination.

### Slugs

Generated from a 58-character alphabet (alphanumerics minus `0 O I l`, which
misread in print), six characters long — about 38 billion combinations. Sequential
IDs are deliberately not used: they would let anyone enumerate your whole customer
list by incrementing a number.

Lookups are case-insensitive, so a hand-typed `/r/ABC123` still resolves.

### Scan counting

The redirect resolver performs an indexed exact-slug lookup and atomically
increments the aggregate counter. **No IP addresses, user agents, or any other
personal data are recorded** — just a count and a timestamp.

The dashboard **Analytics** tab ranks routes by all-time scan count. Counts are
visits to a route, not unique people; daily trends and unique-visitor reporting
are not currently collected.

---

## Testing

```bash
npm test        # unit tests
npm run lint
npm run build
```

Unit tests (`lib/*.test.ts`) cover the pure logic where a silent bug would mean
misprinted cards: slug generation and validation, HTTPS/Google-Review URL
checking, and the public-URL construction the QR encodes.

### Manual checklist

Run against a dev server signed in as your admin user.

| # | Check | Expected |
| --- | --- | --- |
| 1 | Sign in at `/login` with a wrong password, then the right one | Generic error, then TOTP verification and the dashboard |
| 2 | Create a route with the slug field left blank | Success screen with a 6-character slug |
| 3 | Create several routes | Every slug differs; none are `1`, `2`, `3` |
| 4 | Scan the on-screen QR with a phone camera | Opens `<base>/r/<slug>`, which lands on the review page |
| 5 | `curl -I http://localhost:3000/r/<slug>` | `302` (never `301`) and `location:` is the saved URL |
| 6 | Edit the destination, then reload `/r/<slug>` | **Same URL**, new destination — the core guarantee |
| 7 | Deactivate the route, then load `/r/<slug>` | Branded "deactivated" page, `410`, no redirect |
| 8 | Load `/r/doesnotexist` | Branded 404, not a stack trace |
| 9 | Open `/dashboard` in a private window | Redirected to `/login`; an unapproved Supabase user is denied |
| 10 | DevTools device mode at 390×844, 393×852 and 412×915 | No horizontal scrolling on any page; all buttons comfortably tappable |
| 11 | Open the production site in iPhone Safari | Add to Home Screen prompt appears; standalone launch hides it |
| 12 | Scan a route, then open `/dashboard/analytics` | The route appears in most-used links with the updated count |
| 13 | Lock a route, submit an edit with the wrong name | The save is rejected and the confirmation field shows an error |
| 14 | Lock a route, submit an edit with the current business name | The changes save and the route remains locked |
| 15 | Unlock a route, then edit it without a confirmation | The changes save normally |

---

## Deploying to Vercel

Already deployed: project `review-routes` on the `ralds-projects-1208` team,
live at **https://review-routes.vercel.app**. All three environment variables are
set for Production, Preview and Development.

The current deployment was a direct file upload, not connected to git. To get
push-to-deploy, create a GitHub repo and connect it under
**Settings → Git** — the env vars and domain carry over.

Whenever you change an environment variable, **redeploy** — `NEXT_PUBLIC_*`
values are inlined at build time and a running deployment will not pick them up.

> The three `NEXT_PUBLIC_*` variables must be marked **non-sensitive** in Vercel.
> They are inlined into the browser bundle by design, and Vercel refuses to build
> if they are stored with secret visibility.

### Custom domain (`goreview.rald.site`)

The domain is already added to the `review-routes` project. What remains is the
DNS record, at your registrar for `rald.site` (currently Namecheap):

| Type | Host | Value |
| --- | --- | --- |
| `A` | `goreview` | `76.76.21.21` |

Vercel verifies automatically and issues the certificate within a few minutes.
Check progress with:

```bash
vercel domains inspect goreview.rald.site --scope ralds-projects-1208
```

Then confirm `https://goreview.rald.site/r/<slug>` redirects correctly **before
printing any cards** — `NEXT_PUBLIC_REDIRECT_BASE_URL` is already set to this
domain, so every QR code generated encodes it.

Use `https://admin.goreview.rald.site` as **Supabase → Authentication → URL
Configuration → Site URL**, and add
`https://admin.goreview.rald.site/auth/callback` to Redirect URLs. Password
recovery belongs to the admin host; printed card links remain on
`https://goreview.rald.site`.

### Public and admin domains

Add `admin.goreview.rald.site` to the same Vercel project as
`goreview.rald.site`; a second deployment is not needed. Set this production
environment variable and redeploy:

```bash
ADMIN_ORIGIN=https://admin.goreview.rald.site
```

The public host serves the Goreview landing page and `/r/*` card redirects.
Dashboard and authentication routes return 404 on the public host. The admin
host redirects `/` to `/dashboard` and retains the staff allowlist plus MFA.
Vercel preview hosts can render the public landing page but cannot serve admin
routes. Localhost is allowed during development, and skips the MFA challenge
for approved local staff accounts only.

Apply `20260908031556_shop_stories.sql` before deploying the page. It creates
the private photo bucket, public published-only reads, MFA-protected editing,
and the three approved starter shop stories. The landing page remains usable
without story data and refreshes published content at most 60 seconds after a
change.

> Once cards are printed, this domain must keep working indefinitely. Treat it as
> permanent infrastructure: don't let the registration lapse, and don't repoint it.

---

## Architecture

```
app/
  r/[slug]/route.ts               public redirect — the only page customers hit
  login/                          email + password, no sign-up
  (dashboard)/dashboard/          stats, route list, analytics, create, detail, edit
lib/
  google-review.ts                 server-side Maps redirect/ftid converter
  supabase/{client,server,public,proxy}.ts
  slug.ts  validation.ts  qr.ts  routes.ts  branded-response.ts
proxy.ts                          session refresh + auth gating
supabase/migrations/              schema, RLS, scan-count function
```

**Three anon-key Supabase clients, deliberately separated:**

| Client | Key | Used by |
| --- | --- | --- |
| `client.ts` | anon | Client Components |
| `server.ts` | anon + cookies | Server Components, Server Actions |
| `public.ts` | anon, stateless | `/r/[slug]` only |

The redirect can execute one exact-slug `security definer` RPC, but has no public
`SELECT` grant or policy. A visitor therefore cannot enumerate client routes.

**No service worker.** Its scope would cover `/r/*`, and a cached redirect is
exactly the failure this product exists to prevent. The web app manifest still
gives you Add-to-Home-Screen.

### Security notes

- Production RLS requires an active staff allowlist entry and an `aal2` MFA session.
- There is **no `DELETE` policy** — deactivation is soft, so a card in someone's
  hand always resolves to something.
- Table/column grants protect ownership, slugs, timestamps and counters from
  direct client mutation.
- New or changed destinations are limited to approved HTTPS Google URL shapes
  in both Zod and a Postgres trigger.
- Server Actions re-authenticate on every call — a Server Action is a public HTTP
  endpoint, not a trusted internal function.
- Operational onboarding, offboarding, staged deployment and incident response
  are documented in [`SECURITY.md`](./SECURITY.md).
