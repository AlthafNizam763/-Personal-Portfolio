# Personal Portfolio — Next.js + Admin Panel

The portfolio previously built with React + Vite, migrated to **Next.js 15 (App Router)** with
TypeScript, MongoDB and a full admin panel. The public design is unchanged — every section renders
from the same markup and Tailwind classes as before, now driven by database content instead of
hardcoded arrays.

- **Public site** — `/`
- **Admin panel** — `/admin`

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run seed                   # loads the original portfolio content + creates the admin user
npm run dev                    # http://localhost:3000
```

Sign in at <http://localhost:3000/admin/login> with the credentials from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`, then change the password in **Settings**.

### Environment variables

| Variable                | Required | Purpose |
| ----------------------- | -------- | ------- |
| `MONGODB_URI`           | yes      | MongoDB connection string (Atlas or local). |
| `AUTH_SECRET`           | yes      | Signs the admin session cookie. Minimum 32 characters. |
| `NEXT_PUBLIC_SITE_URL`  | yes¹     | Public origin, no trailing slash. Drives canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt`. |
| `BLOB_READ_WRITE_TOKEN` | prod     | Vercel Blob token for uploads. Leave blank locally to write into `public/uploads/`. |
| `SEED_ADMIN_EMAIL`      | seed     | Used by `npm run seed` / `npm run create-admin`. |
| `SEED_ADMIN_PASSWORD`   | seed     | Same. Must be 8+ chars with upper, lower and a digit. |
| `NOTIFY_*`, `RESEND_API_KEY`, `WHATSAPP_*`, `TWILIO_*`, `VAPID_*` | no | Contact-form notifications — see [below](#contact-form-notifications). Channels are switched on in the admin panel; these hold the credentials. |

¹ Falls back to Vercel's injected host, then `http://localhost:3000`.

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Scripts

| Command                | What it does |
| ---------------------- | ------------ |
| `npm run dev`          | Development server. |
| `npm run build`        | Production build. |
| `npm start`            | Serve the production build. |
| `npm run lint`         | ESLint. |
| `npm run typecheck`    | `tsc --noEmit`. |
| `npm run seed`         | Idempotent — only fills collections that are empty. `-- --force` wipes and reseeds. |
| `npm run create-admin` | Create an admin, or reset an existing one's password (signs out all devices). |
| `npm run test-notification` | Fires a fake contact submission at the enabled notification channels, using the same switches the live form does. |
| `npm run generate-vapid-keys` | Prints a VAPID key pair for browser push notifications. Run once, then paste both lines into your environment. |

---

## Deploying to Vercel

1. **Database** — create a MongoDB Atlas cluster. Under *Network Access*, allow `0.0.0.0/0`
   (Vercel's IPs are dynamic) or use Atlas's Vercel integration.
2. **Blob storage (required for uploads)** — in the Vercel project, *Storage → Create → Blob*, and
   connect the store to the project. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically — do not
   add that variable by hand, and remove any placeholder copied from `.env.example`, or the real
   token cannot be injected. Without a working store the admin's upload endpoint answers `503` with
   the reason, since Vercel's filesystem is read-only and the local-disk fallback cannot run there.
   Verify with `vercel blob list-stores`.
3. **Environment variables** — add `MONGODB_URI`, `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`
   (your real domain) for Production, Preview and Development. Add the notification credentials
   here too if you want them in production — see
   [Contact-form notifications](#contact-form-notifications). None of them are required to deploy:
   an unconfigured channel simply reports itself as such in the admin panel.
4. **Deploy**, then seed once against the production database:

   ```bash
   MONGODB_URI="<atlas-uri>" SEED_ADMIN_EMAIL="you@example.com" \
   SEED_ADMIN_PASSWORD="<strong-password>" npm run seed
   ```

`next.config.ts` already allow-lists `**.public.blob.vercel-storage.com` for the image optimizer.

---

## How content reaches the page

```
Admin saves  →  API route writes to MongoDB  →  revalidateTag('portfolio')  →  page regenerates
```

The public page is statically rendered and reads through `unstable_cache` tagged `portfolio`
(`lib/data.ts`). Every admin write busts that tag, so changes appear immediately with no rebuild.
An hourly `revalidate` acts as a backstop.

If MongoDB is unreachable, the page falls back to `lib/seed-content.ts` — a verbatim capture of the
original portfolio content — so the site degrades to "slightly stale" rather than blank.

---

## Project structure

```
app/
├── page.tsx                  public portfolio (server-rendered)
├── layout.tsx                Sora font + dynamic metadata
├── sitemap.ts, robots.ts     generated from the database
├── admin/
│   ├── (auth)/login/         sign-in page (no sidebar)
│   └── (panel)/              sidebar shell + session guard
│       ├── page.tsx          dashboard
│       ├── profile, skills, experience, projects, education,
│       ├── certifications, achievements, services, social-links,
│       ├── messages, settings
│       └── settings/notifications   channel switches + push devices
├── api/
│   ├── auth/                 login, logout, me, account, change-password
│   ├── contact/              public contact form endpoint
│   ├── admin/[resource]/     generic CRUD for all nine collections
│   ├── admin/profile|settings|stats|upload
│   ├── admin/settings/notifications  channel switches (+ /test)
│   ├── admin/push/           push device register / remove / lookup
│   ├── blob-upload/          issues scoped tokens for direct-to-Blob uploads
│   └── uploads/[...path]/    serves local-disk uploads at runtime (range-aware)
components/
├── portfolio/                Hero, Skills, Experience, About, Services,
│                             Projects, Education, Certifications,
│                             Achievements, Contact, Footer, Navbar, …
└── admin/                    ResourceManager, ResourceForm, FormFields,
                              Modal, ConfirmDialog, Toast, AdminShell, screens/
lib/                          db, auth, jwt, data, storage, icons, validators,
│                             resources, serialize, seed-content, utils
└── notifications/            contact-form notifier: config, format,
                              channels/{email,whatsapp,push}.ts
models/                       Mongoose schemas
public/sw.js                  service worker — push display only, no fetch handler
scripts/                      seed.ts, create-admin.ts, test-notification.ts,
                              generate-vapid-keys.ts
legacy-react/                 the original Vite app, kept for reference
```

### Adding a new manageable content type

The admin CRUD is data-driven — there are no per-resource route files:

1. Add a Mongoose model in `models/`.
2. Add a Zod schema in `lib/validators.ts` and a serializer in `lib/serialize.ts`.
3. Register it in `lib/resources.ts` (search/sort/filter fields, file fields, upload folder).
4. Add a screen config in `components/admin/screens/` and a page that renders `<ResourceManager>`.

---

## Contact-form notifications

A saved contact message notifies you over **email**, **WhatsApp** and **browser push**. The order
is fixed in `app/api/contact/route.ts`:

```
validate -> rate-limit -> save to MongoDB -> read notification settings -> notify
        -> 201 -> roach animation -> success popup
```

Nothing is sent for a rejected submission, a honeypot hit, a rate-limited request, or a failed
write — the notifier only runs after `Message.create()` resolves. Conversely nothing about
notifications can cost the visitor their confirmation: with every channel switched off, or every
provider down, the message is still saved and the success flow runs exactly as before. The
fan-out swallows its own errors and reports a per-channel status instead.

### Switching channels on and off

**Admin -> Settings -> Notifications** is the day-to-day control: one switch each for Email,
WhatsApp and Push. The values live on the `SiteSettings` singleton and are read fresh on every
submission — no cache, no redeploy, so a switch flipped now applies to the next message.

Each row also shows whether that channel *can* run, so a switch that is on but silent explains
itself rather than looking broken:

| Badge              | Meaning |
| ------------------ | ------- |
| **Ready**          | Credentials present. Push also shows how many devices are registered. |
| **Not configured** | Switched on, but environment variables are missing (hover to see which). |
| **Off in environment** | `NOTIFY_<CHANNEL>_ENABLED=false` overrides the panel — see below. |

There is a second, deployment-level switch: setting `NOTIFY_EMAIL_ENABLED`,
`NOTIFY_WHATSAPP_ENABLED` or `NOTIFY_PUSH_ENABLED` to `false` forces that channel off no matter
what the panel says. It exists for a staging deployment pointed at the production database.
Leave them unset and the panel decides.

A channel sends only when **the panel switch is on**, **no kill switch blocks it**, and **its
credentials resolve**. Anything else is reported as `disabled` or `misconfigured`.

Providers are chosen the same way:

- **Email** — `EMAIL_PROVIDER=resend` (default) or `sendgrid`. Plain HTTPS + JSON, no SDK.
- **WhatsApp** — `WHATSAPP_PROVIDER=meta` (default, Cloud API) or `twilio`. Same.
- **Push** — Web Push (VAPID) via the `web-push` package, straight to the browser's push service.

Adding another email or WhatsApp provider means one `send*` function and one branch inside the
relevant file in `lib/notifications/channels/`.

```bash
npm run test-notification            # same switches the live form uses
npm run test-notification -- "Ada" ada@example.com
```

There is also a **Send test notification** button on the settings screen, which reports each
channel's status and the provider's own error message inline.

### Browser push

Push is the one channel that needs setup on both ends.

1. `npm run generate-vapid-keys`, then put `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in your
   environment. Generate once and keep them: replacing the pair unsubscribes every device.
2. Open **Settings -> Notifications** on each device you want to be reached on and press
   **Enable on this device**. Permission can only be granted by the browser you are sitting at,
   which is why one switch is not enough.

Registered browsers appear in the device list with the date they were added and their last
delivery, and can be removed individually. A subscription the push service reports as gone
(HTTP 404/410) is deleted automatically on the next send.

Requirements worth knowing: push needs a **secure context** (https, or localhost in development),
and on iPhone/iPad the site must be added to the Home Screen first — the screen says so when the
browser cannot support it. The service worker (`public/sw.js`) is registered at the root scope so
it can receive pushes with the site closed, and deliberately has **no `fetch` handler**, so it
never intercepts a request and the public portfolio behaves exactly as before.

### WhatsApp's 24-hour window

The Cloud API only delivers **free-form text** to someone who messaged your business number in
the previous 24 hours — which a notification to yourself usually is not, so it comes back as
error `131047`. Create an approved template with four body placeholders and set
`WHATSAPP_TEMPLATE_NAME`; the channel then sends that instead:

```
{{1}} name   {{2}} email   {{3}} subject   {{4}} message
```

Plain text is fine while testing inside the window. Twilio behaves the same way.

### What gets sent

Email carries the full submission: name, email, phone (when present), website, subject,
submission time and the message, with **Reply-To set to the visitor** so answering it in your
inbox replies to them. WhatsApp and push carry a short version — sender, subject and a preview —
and push deep-links to the admin inbox.

The form currently has no phone or subject input, so those fall back to "omitted" and
*"New portfolio enquiry from …"* respectively; `contactSchema` and the `Message` model already
accept both, so adding the inputs later needs no other change.

Delivery status is stamped onto the message document (`notifications.email`,
`notifications.whatsapp`, `notifications.push`, `notifications.attemptedAt`,
`notifications.error`), and the public API response carries the statuses alone — never an
address, token or provider payload.

---

## Security

- Sessions are JWTs (HS256, `jose`) in an httpOnly, SameSite=Lax cookie; `secure` in production.
- `middleware.ts` guards `/admin/*` and `/api/admin/*` on the Edge runtime; every route handler
  re-checks the session independently.
- Passwords are bcrypt-hashed (cost 12). Changing one bumps `tokenVersion`, invalidating every
  previously issued cookie.
- Login is rate-limited per IP+email; the contact form per IP. Both are in-memory, so on serverless
  they only constrain a single warm container — put a WAF in front if you need hard guarantees.
- Notification credentials live only in server-side variables (no `NEXT_PUBLIC_` prefix) and are
  read inside `lib/notifications/`, which throws if it is ever bundled for the browser. Provider
  errors are logged and stored, never returned to the visitor. The VAPID *public* key is the one
  value deliberately sent to the browser — it has to be, for a browser to subscribe at all.
- Push endpoints are capability URLs: anyone holding one can push to that browser. They are
  written by the admin-only register route and never read back out; the settings API returns
  device ids and labels only.
- Uploads are restricted by MIME type and by size per kind: 8 MB for an image or PDF, 64 MB for a
  video. Anything over 4 MB skips the serverless function — Vercel rejects a request body over
  4.5 MB before the handler runs — and goes straight to Blob from the browser using a short-lived
  token from `/api/blob-upload`. That token is scoped to the one content type, size and path the
  browser declared, is only issued to a signed-in admin, and the upload-completed callback is
  verified against the store's HMAC signature. The local-disk handler refuses any path that escapes
  `public/uploads`.
- The `?next=` login parameter only accepts in-app `/admin` paths, so it cannot be used as an open
  redirect.
- `/admin` is `noindex` in metadata and disallowed in `robots.txt`.

---

## Notes on the migration

Everything below was a deliberate decision; the visual result on day one is identical to the old
site.

**Preserved exactly** — Sora typography, the black/white/`#71717A` palette, `px-5 lg:px-28`
gutters, the outlined-white headline treatment, the offset-block Resume button, the navbar
hide-on-scroll, the blend-mode cursor, and every Framer Motion transition, including the ones that
differ between sections (the Projects heading is static while Skills and Experience fade in).

**Changed, with reasons:**

- **The contact form works now.** It previously always faked a "500 Internal Server Error" and
  reloaded the page. Submissions now post to `/api/contact` and appear in **Admin → Messages**. The
  error popup — gif and sound intact — is kept for genuine server errors, but it no longer reloads,
  since that would discard whatever the visitor had typed.
- **The custom cursor is hidden on touch devices.** It previously rendered a stuck black
  quarter-circle in the top-left corner on phones, because it never received a `mousemove`. Desktop
  behaviour is unchanged.
- **The hero greeting is an `<h1>`** (was `<h2>`), so the page has exactly one top-level heading.
  Tailwind's preflight resets heading size and weight to `inherit`, so it renders identically.
  Project titles became `<h3>` for the same reason, and the `01` / `02` counters became `<p>` —
  both are block-level, so the layout is unchanged.
- **`assets/…` → `/assets/…`.** The old paths were relative because of the GitHub Pages base path.
- **The experience date is a real date.** The old card hardcoded `"July 3024 - Present"` — a typo
  for 2024. It is stored as `2024-07-01` and rendered as *July 2024 - Present*. Change it in
  **Admin → Experience** if a different date was intended.
- **The hero email link was fixed.** It read `mailto:althafnizam7632gmail.com` (missing `@`); the
  contact section already had the correct address.
- **Location is not displayed.** The original contact block listed only email and phone, so
  `profile.location` feeds the JSON-LD structured data instead of adding a visible line.
- **Technology chips are seeded empty.** Experience and Projects can now show technology chips, but
  the original cards showed none — seeding them would have visibly changed the page. Add them in
  the admin and they appear.

**New sections** — Services, Education, Certifications and Achievements did not exist before. They
have full admin CRUD and public components built from the same design vocabulary, but ship
**disabled and empty**, so the site is unchanged until you add content and enable the section in
**Settings** (each screen shows a one-click prompt).

`legacy-react/` holds the original Vite app for reference. It is excluded from TypeScript and
ESLint and can be deleted once you're happy — the full history is in git.
