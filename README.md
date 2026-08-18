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

---

## Deploying to Vercel

1. **Database** — create a MongoDB Atlas cluster. Under *Network Access*, allow `0.0.0.0/0`
   (Vercel's IPs are dynamic) or use Atlas's Vercel integration.
2. **Blob storage** — in the Vercel project, *Storage → Create → Blob*. Vercel injects
   `BLOB_READ_WRITE_TOKEN` automatically. Without it, uploads fall back to the filesystem, which is
   read-only on Vercel.
3. **Environment variables** — add `MONGODB_URI`, `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`
   (your real domain) for Production, Preview and Development.
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
│       └── messages, settings
├── api/
│   ├── auth/                 login, logout, me, account, change-password
│   ├── contact/              public contact form endpoint
│   ├── admin/[resource]/     generic CRUD for all nine collections
│   ├── admin/profile|settings|stats|upload
│   └── uploads/[...path]/    serves local-disk uploads at runtime
components/
├── portfolio/                Hero, Skills, Experience, About, Services,
│                             Projects, Education, Certifications,
│                             Achievements, Contact, Footer, Navbar, …
└── admin/                    ResourceManager, ResourceForm, FormFields,
                              Modal, ConfirmDialog, Toast, AdminShell, screens/
lib/                          db, auth, jwt, data, storage, icons, validators,
                              resources, serialize, seed-content, utils
models/                       Mongoose schemas
scripts/                      seed.ts, create-admin.ts
legacy-react/                 the original Vite app, kept for reference
```

### Adding a new manageable content type

The admin CRUD is data-driven — there are no per-resource route files:

1. Add a Mongoose model in `models/`.
2. Add a Zod schema in `lib/validators.ts` and a serializer in `lib/serialize.ts`.
3. Register it in `lib/resources.ts` (search/sort/filter fields, file fields, upload folder).
4. Add a screen config in `components/admin/screens/` and a page that renders `<ResourceManager>`.

---

## Security

- Sessions are JWTs (HS256, `jose`) in an httpOnly, SameSite=Lax cookie; `secure` in production.
- `middleware.ts` guards `/admin/*` and `/api/admin/*` on the Edge runtime; every route handler
  re-checks the session independently.
- Passwords are bcrypt-hashed (cost 12). Changing one bumps `tokenVersion`, invalidating every
  previously issued cookie.
- Login is rate-limited per IP+email; the contact form per IP. Both are in-memory, so on serverless
  they only constrain a single warm container — put a WAF in front if you need hard guarantees.
- Uploads are restricted by MIME type and capped at 8 MB. The local-disk handler refuses any path
  that escapes `public/uploads`.
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
