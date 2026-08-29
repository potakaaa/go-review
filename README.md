# Review Routes

Dynamic QR/NFC link management for physical Google Review cards.

Every card is printed once with a permanent URL — `https://goreview.rald.site/r/a7K3mP`.
That URL never changes. The Google Review page it points at is a database row you
can edit from your phone while standing in the cafe. That indirection is the whole
product: **a printed card is never wasted because a destination changed.**

- Mobile-first admin dashboard (built for 390–412px wide phones)
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

This creates the `redirect_routes` table, its RLS policies, the
`increment_scan_count` function, and the nullable `maps_url` source-link field.

### 3. Create your admin account

There is deliberately **no sign-up page**. Create your user by hand:

**Supabase dashboard → Authentication → Users → Add user**, with
*Auto Confirm User* enabled.

Anyone with an account can manage their own routes, and RLS makes them unable to
see anyone else's. To lock the app to exactly one person, simply don't create a
second user.

### 4. Environment

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` |
| `NEXT_PUBLIC_REDIRECT_BASE_URL` | `https://goreview.rald.site` |

> **`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security.** It is used in
> exactly one file (`lib/supabase/admin.ts`, guarded by `import "server-only"`)
> and must never be given a `NEXT_PUBLIC_` prefix.

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

1. **Create Route** — enter the business name, then paste a Google Maps
   share link into **Convert a Google Maps link**. Tap **Convert link** to
   generate the direct Google review URL; it is placed into the destination
   field automatically, while the original Maps link is saved with the route.
   When editing later, that source link is already there to convert again. You
   can also use **Convert Maps link** from the dashboard when you only need the
   direct URL. Leave the slug blank and a random one like `a7K3mP` is generated.
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

### Slugs

Generated from a 58-character alphabet (alphanumerics minus `0 O I l`, which
misread in print), six characters long — about 38 billion combinations. Sequential
IDs are deliberately not used: they would let anyone enumerate your whole customer
list by incrementing a number.

Lookups are case-insensitive, so a hand-typed `/r/ABC123` still resolves.

### Scan counting

The redirect responds first and increments the counter afterwards via `after()`,
so a scan never waits on analytics. **No IP addresses, user agents, or any other
personal data are recorded** — just a count and a timestamp. A dropped count is
an acceptable loss; a slow redirect is not.

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
| 1 | Sign in at `/login` with a wrong password, then the right one | Error message, then the dashboard |
| 2 | Create a route with the slug field left blank | Success screen with a 6-character slug |
| 3 | Create several routes | Every slug differs; none are `1`, `2`, `3` |
| 4 | Scan the on-screen QR with a phone camera | Opens `<base>/r/<slug>`, which lands on the review page |
| 5 | `curl -I http://localhost:3000/r/<slug>` | `302` (never `301`) and `location:` is the saved URL |
| 6 | Edit the destination, then reload `/r/<slug>` | **Same URL**, new destination — the core guarantee |
| 7 | Deactivate the route, then load `/r/<slug>` | Branded "deactivated" page, `410`, no redirect |
| 8 | Load `/r/doesnotexist` | Branded 404, not a stack trace |
| 9 | Open `/dashboard` in a private window | Redirected to `/login`; create a second Supabase user and confirm it sees none of your routes |
| 10 | DevTools device mode at 390×844, 393×852 and 412×915 | No horizontal scrolling on any page; all buttons comfortably tappable |

---

## Deploying to Vercel

Already deployed: project `review-routes` on the `ralds-projects-1208` team,
live at **https://review-routes.vercel.app**. All four environment variables are
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

Add `https://goreview.rald.site` to **Supabase → Authentication → URL Configuration →
Site URL**, and add `https://goreview.rald.site/**` to Redirect URLs.

> Once cards are printed, this domain must keep working indefinitely. Treat it as
> permanent infrastructure: don't let the registration lapse, and don't repoint it.

---

## Architecture

```
app/
  r/[slug]/route.ts               public redirect — the only page customers hit
  login/                          email + password, no sign-up
  (dashboard)/dashboard/          stats, route list, create, detail, edit
lib/
  google-review.ts                 server-side Maps redirect/ftid converter
  supabase/{client,server,admin,proxy}.ts
  slug.ts  validation.ts  qr.ts  routes.ts  branded-response.ts
proxy.ts                          session refresh + auth gating
supabase/migrations/              schema, RLS, scan-count function
```

**Three Supabase clients, deliberately separated:**

| Client | Key | Used by |
| --- | --- | --- |
| `client.ts` | anon | Client Components |
| `server.ts` | anon + cookies | Server Components, Server Actions |
| `admin.ts` | service role | `/r/[slug]` only |

The redirect uses the service role rather than a public `SELECT` policy — a public
policy would let anyone enumerate every client's slug and destination.

**No service worker.** Its scope would cover `/r/*`, and a cached redirect is
exactly the failure this product exists to prevent. The web app manifest still
gives you Add-to-Home-Screen.

### Security notes

- RLS is enabled with policies for select/insert/update scoped to `auth.uid()`.
- There is **no `DELETE` policy** — deactivation is soft, so a card in someone's
  hand always resolves to something.
- `increment_scan_count` is `security definer` with `EXECUTE` revoked from `anon`
  and `authenticated`, so nobody can inflate a client's scan count.
- Destination URLs are constrained to `https://` in both Zod and a Postgres
  `CHECK`, which blocks `javascript:` and `data:` payloads at the database.
- Server Actions re-authenticate on every call — a Server Action is a public HTTP
  endpoint, not a trusted internal function.
