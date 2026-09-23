# Al Bustan Communities Limited — Website

Premium real-estate website, built in phases.

- **Phase 1** — project foundation, design system, global components
- **Phase 2** — homepage
- **Phase 3** — About Us
- **Phase 4** — Projects + project details
- **Phase 5** — Admin authentication + Project CMS (PostgreSQL)
- **Phase 6** — Blog + Blog CMS
- **Phase 7** — Contact + inquiries
- **Phase 8** — Floating WhatsApp/Phone/Messenger widget
- **Phase 9** — Website Settings admin panel
- **Phase 10** — Final responsive/SEO/performance/accessibility/security audit
- **Gallery page** — added after Phase 10, see below (current)

## Next.js 16 migration

Migrated from Next.js 14.2.15 (React 18) to Next.js 16 (React 19) with
Turbopack, which is the default bundler for both `next dev` and
`next build` in v16 — no script changes needed.

**What changed:**

- `package.json` — `next` → `^16.3.3`, `react`/`react-dom` → `^19.0.0`,
  `eslint-config-next` → `^16.3.3`, `@types/react`/`@types/react-dom`
  → `^19.0.0`, `engines.node` → `>=20.9.0` (Next 16 dropped Node 18
  support)
- **`middleware.ts` → `proxy.ts`**, function renamed `middleware` →
  `proxy`. This is Next 16's own required rename (`middleware.ts`
  still works but is deprecated and slated for removal); logic is
  unchanged. It also now runs on the Node.js runtime instead of Edge
  by default — a non-issue here since the file only calls
  `getToken()`, nothing Edge-specific.
- **Async Request APIs, now mandatory** (Next 15 allowed the old
  synchronous access with a warning; Next 16 removes it entirely).
  Every page/layout using `params` or `searchParams` now types them
  as `Promise<...>` and awaits them: both project/blog detail pages
  (and their `generateMetadata`), both admin edit pages, the
  projects/blog listing pages, and the admin inquiries page — 7
  files.
- **`.npmrc`** added with `legacy-peer-deps=true`. Needed because
  `next-auth@4` (the version this project uses, per the earlier
  decision to avoid Auth.js v5 while it's still in beta) declares
  `peerDependencies: { next: "^12.2.5 || ^13 || ^14 || ^15" }` — it
  doesn't list 16 yet, even though it works correctly with it. Without
  this file, `npm install` fails outright on the peer conflict. Remove
  it once next-auth publishes a release with an updated range.

**Deliberately left unchanged in this pass** (not required for Next 16
compatibility): Tailwind, zod, bcryptjs, `@supabase/supabase-js`, and
the `useFormState` hook used in 6 admin/public forms — it's
deprecated in favor of `useActionState` but still works in React 19,
so swapping it is a follow-up code-quality improvement, not a
migration requirement. (Prisma was upgraded separately — see below.)

**⚠️ I could not run `npm install`, `tsc`, or `next build` myself** —
this sandbox has no network access to install packages. Every change
above was made through careful manual/static review (checked every
file using dynamic route params or search params, cross-referenced
against Next.js's own v16 upgrade guide), but you should still run:

```bash
npm install   # legacy-peer-deps is applied automatically via .npmrc
npx tsc --noEmit
npm run build
```

locally and send me the output if anything surfaces — I'll fix it
directly.

## Prisma 7 migration

Upgraded from Prisma 5.19.1 to Prisma 7. This is a genuinely large
breaking-change surface — bigger than a typical major bump — because
Prisma 7 removed the built-in Rust query engine entirely.

**What changed:**

- **`package.json`** — `prisma`/`@prisma/client` → `^7.0.0`; added
  `@prisma/adapter-pg` + `pg` (dependencies) and `@types/pg` +
  `dotenv` (dev dependencies) — all required, not optional, see below.
  Removed the `"prisma": { "seed": ... }` field (moved to
  `prisma.config.ts`).
- **New `prisma.config.ts`** (project root) — Prisma 7 requires this
  file. It now holds the seed command and the database connection URL,
  both of which used to live elsewhere (package.json and
  `schema.prisma` respectively).
- **`prisma/schema.prisma`** — removed `url = env("DATABASE_URL")`
  from the `datasource` block; Prisma 7 no longer allows a connection
  URL there at all (it lives in `prisma.config.ts` now). The
  `provider = "postgresql"` line stays.
- **Driver adapters are now mandatory** — Prisma 7 has no built-in
  engine, so every database needs an explicit adapter. `bare new
  PrismaClient()` is invalid in v7. Both `src/lib/prisma.ts` (the
  app's shared client) and `prisma/seed.ts` (which makes its own,
  being a standalone script) now construct a `PrismaPg` adapter from
  `@prisma/adapter-pg` with the connection string, and pass it to
  `new PrismaClient({ adapter })`.
- **Kept the `prisma-client-js` generator** (in `schema.prisma`)
  instead of switching to Prisma 7's new recommended `prisma-client`
  generator. This is deliberate: the new generator's ESM output has a
  documented module-resolution bug under Next.js 16 + Turbopack
  ("Cannot find module '.prisma/client/default'"). `prisma-client-js`
  still works in v7 (deprecated, not removed) and avoids that bug
  entirely — this combination is what's actually confirmed to work
  together, not just the officially "recommended" path. Worth
  revisiting once Turbopack's handling of the new generator matures.
- **`next.config.mjs`** — added `serverExternalPackages: ["@prisma/client", "pg"]`,
  which the same Turbopack compatibility fix requires: it keeps
  Prisma's generated client and `pg`'s native Node bindings out of
  Turbopack's own bundling and loaded as real Node modules instead.
- **`prisma/seed.ts`** now explicitly loads `.env` itself
  (`import "dotenv/config"`) — it runs directly via `tsx`, not
  through the Prisma CLI, so `prisma.config.ts`'s own env loading
  doesn't apply to that invocation path.

**⚠️ Same caveat as the Next.js 16 migration above: I could not run
`npm install`, `prisma generate`, or `next build` myself** (no
network access in this sandbox). This migration in particular
touches how the database connects at a fairly deep level, so please
run these in order and send me the output if anything comes up:

```bash
npm install
npx prisma generate
npx tsc --noEmit
npm run build
```

If `prisma generate` or the build complains about the adapter or
connection setup, paste the exact error and I'll fix it directly —
adapter APIs are one of the areas most likely to have shifted
slightly between Prisma 7 patch releases.



The Gallery feature added a new table (`GalleryImage`). After
replacing your files, run:

```bash
npm run db:push
```

No new seed data — the Gallery page already has content from your
existing published projects' photos; standalone gallery photos are
optional and added from `/admin/gallery`.


## ⚠️ If you're updating an existing local copy from Phase 7

Phase 9 added a new table (`WebsiteSettings`, a singleton row) and
migrated every page that showed contact info off the old static
`siteSettings` constant onto it. After replacing your files, run:

```bash
npm run db:push
npm run db:seed
```

`db:seed` is safe to re-run — it only creates the settings row if
one doesn't already exist (`update: {}` in the upsert), so it will
never overwrite real settings you've since saved from
`/admin/settings`. If you skip this step, the site still works —
`src/lib/data/settings.ts` falls back to the same placeholder values
that used to live in `src/lib/constants.ts` — but the admin panel
won't have anything to edit until the row exists.

## ⚠️ If you're updating an existing local copy from Phase 6

Phase 7 added a new table (`ContactInquiry`) and a new `SiteSettings`
field (`latitude`/`longitude`, both placeholder `null` for now).
After replacing your files, run:

```bash
npm run db:push
```

No new seed data — inquiries start empty since they're real
user-submitted records, not placeholder content.

## ⚠️ If you're updating an existing local copy from Phase 5

Phase 6 added two new tables (`BlogCategory`, `BlogPost`). After
replacing your files, run these two commands again before
`npm run dev`:

```bash
npm run db:push
npm run db:seed
```

`db:push` adds the new tables without touching your existing
projects; `db:seed` is safe to re-run — it skips re-seeding anything
that already exists (projects included) and only adds the 3
placeholder blog posts since you won't have any yet.

## ⚠️ If you're updating an existing local copy from an earlier phase

Phase 5 restructured routes into `(site)` and `admin/(dashboard)`
route groups. If you extracted this zip **on top of** an existing
project folder, delete these old files/folders first — they're
leftover duplicates that will silently break routing (e.g. the
homepage calling data functions without `await`, since it's the
stale Phase 1–4 file underneath the new one):

```
src/app/page.tsx
src/app/about/
src/app/projects/
src/app/blog/
src/app/contact/
```

The current, correct versions of these live under
`src/app/(site)/`. When in doubt, extract into a **fresh, empty
folder** instead of over an existing one — that's the reliable way
to avoid this class of bug going forward.

## Run locally (VS Code)

The site is backed by PostgreSQL via Prisma.

1. Open this folder in VS Code.
2. Get a Postgres database — either:
   - **Local via Docker**:
     ```bash
     docker run --name al-bustan-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
     ```
   - **Hosted free tier** (no Docker needed): create a database on
     [Neon](https://neon.tech), [Supabase](https://supabase.com), or
     [Railway](https://railway.app) and copy the connection string
     they give you.
3. Create your local env file:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and set:
   - `DATABASE_URL` to your Postgres connection string
   - `NEXTAUTH_SECRET` to a random string (e.g. output of
     `openssl rand -base64 32`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` to whatever you want your admin
     login to be
   - Image storage: either set up a free Supabase project and fill in
     `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` /
     `SUPABASE_STORAGE_BUCKET` / `NEXT_PUBLIC_SUPABASE_URL` /
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` (recommended — matches what
     production uses), **or** set both `STORAGE_PROVIDER=local` and
     `NEXT_PUBLIC_STORAGE_PROVIDER=local` to skip that for now and
     just write uploaded images to disk during local development
4. Install dependencies (this also generates the Prisma client via
   `postinstall`):
   ```bash
   npm install
   ```
5. Create the database tables:
   ```bash
   npm run db:push
   ```
6. Seed the admin user and placeholder projects:
   ```bash
   npm run db:seed
   ```
7. Start the dev server:
   ```bash
   npm run dev
   ```
8. Open http://localhost:3000 for the public site, or
   http://localhost:3000/admin/login to sign in with the
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`.

Requires Node.js 18.18+ (Node 20 LTS recommended).

If you ever want to reset the database, run
`npx prisma migrate reset` (drops and recreates all tables, then
re-runs the seed automatically), or drop/recreate the database
manually and repeat steps 5–6.

## What's in Phase 1

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Centralized design tokens in `tailwind.config.ts` (color, type scale,
  spacing, shadows) — no hard-coded colors/fonts in components
- Global fonts: Fraunces (display/serif) + Work Sans (body), loaded via
  `next/font/google`
- Global components: `Navbar` (with Projects dropdown + mobile menu),
  `Footer`, `Button`, `Container`, `Section`
- Full route skeleton so navigation works end-to-end, each page a
  placeholder until its phase is built:
  - `/`, `/about`, `/projects`, `/projects/ongoing`,
    `/projects/completed`, `/projects/upcoming`, `/projects/[slug]`,
    `/blog`, `/blog/[slug]`, `/contact`, custom 404
- `src/lib/constants.ts` — single source of truth for site settings
  (phone, email, address, nav links) — all placeholders, clearly
  labeled, ready to be swapped for real content or a CMS later
- `src/lib/types.ts` — CMS-ready TypeScript types for `Project`,
  `BlogPost`, `ContactInquiry`, `SiteSettings`, used from Phase 4 onward

## Design tokens

- **Colors** — refreshed to a fuller, still garden-grounded palette:
  `ink` (near-black text), `garden` (primary brand green, 50–900
  scale — foliage), `brass` (warm marigold amber, 50/DEFAULT/light/dark
  — garden-path flowers), `sky` (cool blue, 50/DEFAULT/light/dark —
  open sky/water feature), `limestone` (backgrounds). The three
  accents are used with intent, not just decoration — see
  `ProjectStatusBadge`: ongoing/green, completed/sky, upcoming/marigold
- **Type**: `font-display` (Fraunces) for headings, `font-body` (Work
  Sans) for everything else, with a defined type scale (`text-xs` →
  `text-6xl`)
- **Layout**: `max-w-content` (1240px) via the `Container` component,
  consistent vertical rhythm via the `Section` component

## UI/UX polish pass — typography, cards, spacing (public site only)

A follow-up to the color refresh below, specifically addressing
"text feels too small" and asking for a more modern, polished,
colorful public-facing UI. A real estate site screenshot was
provided as a style reference (not to be copied) — mainly informed
card/button/section polish, not a redesign. **Admin dashboard and
database were intentionally not touched.**

- **Type scale bumped** (`tailwind.config.ts`) — every step (`xs`
  through `6xl`) increased by roughly one size, keeping the same
  relative hierarchy (nothing flattened, headings still read clearly
  larger than body text). This is the highest-leverage change: since
  most of the site uses the shared scale, it improved readability
  everywhere at once.
- **Explicitly sized real reading content that had no size class or
  was set to `text-sm`** where it should read as primary content —
  project/blog descriptions, About page overview/vision/mission/values,
  Contact page details and FAQ answers, project detail full
  description/features/nearby facilities/pricing, and blog article
  body copy (bumped to `text-lg` — long-form reading benefits from a
  larger size than card text). Labels, timestamps, and other genuine
  metadata were left at their (now-larger) small sizes — the goal was
  fixing what was too small to read comfortably, not flattening the
  hierarchy by making everything the same size.
- **Modern cards** — `ProjectCard` and `BlogCard` now lift and gain a
  deeper shadow on hover (new `shadow-card-hover` token), larger
  border radius, a location-pin icon, and (on `ProjectCard`) a
  metadata row showing total area/sizes offered when available.
  `BlogCard` gained a category pill on the image itself.
- **Better buttons** — slightly more generous padding, rounded
  corners, a subtle shadow that deepens on hover for the primary
  variant.
- **Larger border radius scale** (`4px → 16px` range, was `2px → 6px`)
  applied across public cards, forms, and containers for a more
  contemporary feel — kept short of "bubbly," still reads as
  premium/corporate rather than playful.
- **More generous section spacing** — vertical section padding
  increased (`py-16/24` → `py-20/28`).
- **Public form inputs** (contact form, project inquiry form) — larger
  padding, larger text, rounded corners to match the card refresh.
  Admin form inputs were left as-is (out of scope for this pass).

## Design refresh (visual pass after Phase 10)

Requested: more colorful, user-friendly, client-oriented, modern.
Changes, all within the existing token system so nothing else had to
be rebuilt:

- Expanded from a single muted accent (`brass`) into three
  intentional hues tied to the "Al Bustan" (**the garden**) concept:
  green foliage, marigold flowers, sky/water — see `tailwind.config.ts`
- **Status colors now carry meaning**: ongoing (green/growing),
  completed (sky/settled), upcoming (marigold/anticipated) — applied
  to `ProjectStatusBadge`, the homepage's live project-count tiles,
  and admin inquiry statuses, instead of one color for everything or
  a flat black
- **"Why choose us"** (homepage) and **"Core values"** (About) went
  from plain text lists to colored icon badges, cycling through the
  three accents — friendlier and easier to scan at a glance
- CTA banners stay confidently on-brand green — diluting the primary
  action color for variety would hurt recognition, not help it; the
  color variety lives in the informational/status moments instead

## Gallery page

- **`/gallery`** (new top-level nav item, between Projects and Blog):
  combines two sources into one grid automatically — every photo
  from every **published** project (cover + gallery images, no
  extra work needed), plus any standalone photos the admin adds
  directly. Click a photo for a lightbox; project photos link back
  to that project, standalone photos show their caption if one was
  set
- **`/admin/gallery`** (new sidebar link): add one or more standalone
  photos at once (same direct-to-Supabase upload as everywhere
  else), with an optional shared caption; publish/unpublish or
  delete existing standalone photos. Project photos aren't managed
  here — editing those still happens on the project itself, and they
  flow into the Gallery page automatically
- New `GalleryImage` table for the standalone photos only — project
  photos are read live from the existing `Project`/`ProjectImage`
  tables, nothing duplicated

## Land/Plot + Flat project support, real content, and favicon

Requested after the design refresh: the CMS needed to properly
support both land/plot and flat/apartment projects (not just plots),
the placeholder content needed replacing with the company's real
content, and a favicon was needed.

**Schema/CMS (kept as one flexible model, not separate tables):**

- Added `Project.category` (`land_plot` | `flat`) plus shared fields
  (`totalUnits`, `availableUnits`, `sizesOffered`, `pricingInfo`,
  `nearbyFacilities`, `brochureUrl`, `masterPlanUrl`) and one
  flat-only field (`bedroomOptions`)
- Admin `ProjectForm` shows a category selector and all the new
  fields (bedroom options only appears for Flat), plus a master plan
  image upload and a brochure PDF upload
- **New: brochure (PDF) uploads.** Extended the existing direct-to-Supabase
  upload architecture (from the earlier production-readiness pass)
  to handle documents alongside images — same signed-URL flow, same
  reliability on Vercel, just a different allowed type/size
  (`src/lib/storage/types.ts`: `validateDocumentFile`, 10MB max)
- Public project detail page: category-aware labels ("Plots" vs
  "Flats"), new Nearby Facilities / Pricing / Master Plan sections,
  a brochure download button, and the standard disclaimer at the
  bottom of every project page
- `/projects` now has a category filter alongside the status filter;
  `ProjectCard` shows a Land/Plot vs Flat badge

**Real content** (replacing the old placeholder copy, from the
company-provided content document):

- `prisma/seed.ts` rewritten: seeds one real project (Al Bustan
  Purbachal City, full details, features, and nearby facilities from
  the source content) and real `WebsiteSettings` (address, phone,
  WhatsApp, email — see `.env`/admin for what's still placeholder,
  namely business hours and social links, which weren't provided).
  No more placeholder blog posts — the blog starts genuinely empty
- Homepage, About, and Contact pages rewritten with the real company
  positioning, vision, mission, core values, and approach; added a
  new "What We Develop" section and an FAQ section on the Contact page
- **Empty sections now hide themselves**: the "Completed" and
  "Upcoming" project nav items only appear once a project with that
  status exists; "From the blog" and the Blog nav link stay hidden
  until the first article is published; the homepage's status tiles
  only show statuses with at least one project
- ⚠️ This only affects a **fresh** database. If projects/settings
  already exist in yours, the seed script won't overwrite them (by
  design, so it never clobbers real admin edits) — update existing
  placeholder content by hand via `/admin/projects` and
  `/admin/settings` instead, or reset the database and reseed

**Favicon**: generated from the company logo (`public/images/logo.png`)
— cropped to just the house/"A" mark (the full wordmark isn't
legible at favicon size), placed as `src/app/favicon.ico`,
`src/app/icon.png`, and `src/app/apple-icon.png`, which Next.js's
App Router picks up automatically — no metadata code needed.

## What's in Phase 2

- Full homepage at `/`: hero, company introduction, featured projects,
  a live Ongoing/Completed/Upcoming overview (counts computed from
  data, not hard-coded), a "why choose us" section, a CTA banner,
  latest blog posts, and a contact CTA
- New reusable components: `ProjectCard`, `ProjectStatusBadge`,
  `BlogCard`
- Placeholder content data in `src/lib/data/projects.ts` and
  `src/lib/data/blog.ts`, written against the `Project` and
  `BlogPost` types from Phase 1 — swapping these for real database
  queries in later phases won't require changing any component
- Placeholder photography from Unsplash (free license) via
  `next/image`, already allow-listed in `next.config.mjs`

## What's in Phase 3

- Full About Us page at `/about`: company overview, vision, mission,
  core values, our approach (a genuine 4-step sequence, hence
  numbered), leadership placeholders, and a closing CTA
- No real company history, people, achievements, awards, or
  statistics were invented — every specific is a bracketed
  placeholder, including the suggested core values and leadership
  entries, which are clearly marked as replaceable defaults

## What's in Phase 4

- Real logo added at `public/images/logo.png`, wired up via
  `siteSettings.logoUrl` — the Navbar now renders it (taller header,
  uppercase-tracked nav links, "Get in Touch" button) instead of the
  text wordmark placeholder
- `/projects` — full listing with status filter tabs (All / Ongoing /
  Completed / Upcoming) via `?status=` query param, server-rendered
- `/projects/ongoing`, `/projects/completed`, `/projects/upcoming` —
  each filtered from the same placeholder data source
- `/projects/[slug]` — full detail page: hero, overview, project
  information panel, features checklist, image gallery (with a
  lightweight lightbox), location map, and an inquiry form
  pre-filled with the project's id/name
- 6 placeholder projects now in `src/lib/data/projects.ts` (2 per
  status), each with a 3-image gallery, so listing and filtering
  are easy to see in action
- New reusable components: `ProjectGrid`, `EmptyState`, `LoadingState`,
  `ErrorState`, `ImageGallery`, `Map`, `InquiryForm`
- `Map` renders an OpenStreetMap embed (no API key needed) once a
  project has real coordinates, and a clearly labeled placeholder
  until then — none of the placeholder projects have invented
  coordinates
- The inquiry form was UI-only at this point (validated, showed a
  sent confirmation, but didn't persist anything) — Phase 7 connects
  it to the real Contact/Project Inquiries database.

## What's in Phase 5

- **Real database**: Prisma + **PostgreSQL** (`prisma/schema.prisma`) —
  `AdminUser` and `Project`/`ProjectImage` models, with a native
  `ProjectStatus` enum and a native `features` string array (both
  possible because Postgres supports them, unlike SQLite)
- **Admin authentication**: NextAuth (credentials provider), password
  hashed with bcrypt, JWT session. `middleware.ts` protects every
  `/admin/*` route except `/admin/login`; the admin layout also
  checks the session server-side as defense in depth
- **Admin Dashboard** (`/admin`): live counts (total/ongoing/
  completed/upcoming/published/unpublished) pulled from the database
- **Project CMS** (`/admin/projects`): table of every project
  (including unpublished drafts) with inline publish/unpublish
  toggle and delete; **Add Project** and **Edit Project** forms
  handle every field from the spec, cover + gallery image upload,
  and existing-gallery-image removal
- **Storage abstraction** (`src/lib/storage/`): a `StorageProvider`
  interface implemented by `LocalStorageProvider` (local dev only)
  and `SupabaseStorageProvider` — used for deleting old images on
  replace/remove/delete. Uploads themselves go directly from the
  browser to Supabase instead of through this interface — see
  "Production readiness review" below for why and how
- **Status changes take effect immediately** — editing a project's
  status in the admin moves it between `/projects/ongoing`,
  `/projects/completed`, and `/projects/upcoming` on the public site
  automatically, since both read from the same database
- The public site (`/`, `/projects`, the status pages, and
  `/projects/[slug]`) now reads from the database instead of static
  placeholder data — the 6 sample projects from Phase 4 are seeded
  in via `prisma/seed.ts` so there's real content to manage from day
  one
- Route structure: public pages moved into a `(site)` route group
  (adds the Navbar/Footer) and the protected admin pages into an
  `admin/(dashboard)` route group (adds the admin sidebar) — the
  admin login page sits outside both, so it renders as a clean,
  chrome-free screen

## What's in Phase 6

- **Database**: added `BlogCategory` and `BlogPost` models to
  `prisma/schema.prisma`
- **Blog CMS** (`/admin/blog`, now a live sidebar link): table of
  every article (including drafts) with publish/unpublish toggle and
  delete; **Add Blog Post** and **Edit Blog Post** forms cover title,
  slug, excerpt, content, author, publication date, featured image
  upload, and category — pick an existing category or type a new one
  inline, no separate "manage categories" screen needed
- **Public blog** (`/blog`): featured article (the latest post),
  category filter pills, and a search box — all server-rendered via
  URL query params (`?category=`, `?q=`) so it works without
  JavaScript and stays simple
- **Article page** (`/blog/[slug]`): title, featured image, author,
  date, category, content (plain text, paragraphs split on blank
  lines — no rich-text editor added, to avoid an unnecessary
  dependency), and related articles from the same category
- Dashboard now also shows blog counts, and gained a quick "Add Blog
  Post" button alongside "Add Project"
- 3 placeholder articles across 3 categories (Design, Community,
  Buying Guide) are seeded in via `prisma/seed.ts`, matching the
  fixed seed script behavior: re-running `db:seed` after projects
  already exist will still seed the blog if it doesn't yet

## What's in Phase 7

- **Database**: added `ContactInquiry` model (with an `InquiryStatus`
  enum: new/contacted/in_progress/closed) and `latitude`/`longitude`
  to `SiteSettings`
- **Public contact page** (`/contact`): company address, business
  hours, phone, email, a map (placeholder until real coordinates are
  set — same pattern as project maps), and a contact form
- **Contact form now actually persists** — both the general contact
  form and each project's inquiry form (previously UI-only since
  Phase 4, just logging to the console) now submit through one
  shared server action (`src/lib/actions/inquiries.ts`) and create a
  real `ContactInquiry` row. Project inquiries automatically carry
  the project's id and name (a soft reference, not a foreign key, so
  the inquiry stays intact even if that project is later edited or
  removed)
- **Admin Inquiries** (`/admin/inquiries`, now a live sidebar link):
  every submission, with status filter tabs, a status dropdown per
  inquiry (updates immediately), and delete
- Dashboard now shows inquiry counts too

## What's in Phase 8

- **Floating contact widget** on every public page (added in the
  `(site)` layout, not on admin pages): a single round button that
  expands into WhatsApp / Call / Messenger options. Each option only
  appears if that value is actually configured — Messenger stays
  hidden until a Messenger link is set in Website Settings
- Fully keyboard/screen-reader accessible (`aria-label`,
  `aria-expanded` on the toggle button)
- Positioned so it doesn't cover page content on small screens
  (`bottom-5 right-5`, scaled up slightly on larger screens)

## What's in Phase 9

- **Database**: added a `WebsiteSettings` singleton model (always
  read/written at a fixed id, `"singleton"`, since there's exactly
  one settings record for the whole site)
- **`/admin/settings`** (now a live sidebar link — the "Coming
  later" placeholder section is gone, every admin section from the
  spec is built): company name, logo (uploaded the same way as
  project/blog images), phone, WhatsApp link, email, Messenger link,
  address, coordinates, business hours, social links, and default
  SEO title/description — all in one form
- **Every page that showed contact info now reads from this table**
  instead of the static placeholder constant: the Navbar and Footer
  (passed down as props from the `(site)` layout, which fetches
  settings once), the homepage's contact section, the `/contact`
  page, the floating widget, and the root layout's default page
  title/description/Open Graph tags (`generateMetadata`, now async)
- `src/lib/constants.ts`'s old `siteSettings` constant is renamed to
  `defaultSiteSettings` and kept as the fallback `src/lib/data/settings.ts`
  uses if the settings row doesn't exist yet — the site never breaks
  just because `/admin/settings` hasn't been saved once

## What's in Phase 10

- **`sitemap.ts`** — dynamic sitemap covering every static page plus
  every published project and blog post (regenerated on each
  request, so new content appears automatically)
- **`robots.ts`** — allows everything except `/admin` and `/api`,
  points crawlers at the sitemap
- Final pass confirmed: every image has alt text, every form field
  has an associated label, focus states are visible everywhere
  (global `:focus-visible` outline from Phase 1), icon-only buttons
  (mobile menu toggle, floating widget toggle) have `aria-label`s,
  and `prefers-reduced-motion` is respected (Phase 1's global CSS)
- Security and performance items from earlier passes remain in place
  (see "Production readiness review" below) — this phase didn't
  change any of that, just reviewed it holds

## Production readiness review

A full pass was done for going live on Vercel and on the paid host at
albustancommunities.com. Changes made:

- **Image storage moved to Supabase Storage** (`src/lib/storage/supabase.ts`),
  now the default `STORAGE_PROVIDER`. This was necessary, not
  optional: `LocalStorageProvider` writes to disk, and Vercel's
  filesystem is ephemeral and not shared across function instances —
  an image uploaded through the admin would appear to save
  successfully and then 404 shortly after. `LocalStorageProvider`
  still exists for local development without a Supabase project
  configured (`STORAGE_PROVIDER=local`), and works fine on a
  traditional persistent-filesystem host (VPS) if you ever prefer it
  there.
- **Found and fixed the likely cause of the admin image upload
  issue**: Next.js Server Actions default to a 1MB request body
  limit. Uploading a normal-sized photo would silently fail against
  that. `next.config.mjs` now sets `serverActions.bodySizeLimit`
  explicitly, and the per-image validation limit
  (`src/lib/storage/types.ts`) was set to 4MB — kept deliberately
  under Vercel Serverless Functions' own hard ~4.5MB request-body
  ceiling, which no `next.config.mjs` setting can raise. The admin
  forms now show this limit next to each upload field.
- **`next.config.mjs` image domains**: added a `**.supabase.co`
  remote pattern so `next/image` can load the new Supabase-hosted
  URLs (it will otherwise refuse to render images from a domain
  that isn't explicitly allow-listed).
- **Orphaned file cleanup**: replacing a cover/featured image,
  removing a gallery image, or deleting a project/post now also
  deletes the old file from storage (best-effort — a cleanup failure
  never blocks or rolls back the database change). Previously, old
  files were left behind indefinitely.
- **Baseline security headers** (`X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
  were already added in an earlier pass and remain in place.
- Added `"engines": { "node": ">=18.18.0" }` to `package.json` for
  clarity across environments.

### Final upload-reliability fix: direct browser-to-Supabase uploads

The 4MB-per-image limit above reduces the risk, but a cover image
plus several gallery images in *one* form submission could still add
up to more than Vercel's hard ~4.5MB Serverless Function request-body
ceiling — a limit no `next.config.mjs` setting can raise. Shrinking
limits further would only patch around that, not fix it.

The actual fix: admin image uploads (cover, gallery, and blog
featured images) now go **directly from the browser to Supabase
Storage**, never through our own server function:

1. The browser asks a tiny API route (`/api/admin/upload-url`) to
   prepare an upload slot — that request has no file bytes in it, so
   it's nowhere near any size limit.
2. That route uses the secret service-role key to mint a short-lived,
   single-use signed upload token for an exact file path.
3. The browser uploads the file directly to Supabase using that
   token — this request goes straight to Supabase, bypassing our
   server (and therefore Vercel's request-size limit) entirely.
4. Only the resulting image URL (a short string) is included when the
   admin form is actually submitted — regardless of how many images
   were uploaded, that submission stays tiny.

This means uploading a cover image and several gallery images in one
go is now reliable on Vercel no matter their combined size (up to
whatever limit you set on the Supabase bucket itself — see below).

Local development without a Supabase project still works exactly as
before: set `STORAGE_PROVIDER=local` **and**
`NEXT_PUBLIC_STORAGE_PROVIDER=local` in `.env`, and uploads go through
a local-only fallback route (`/api/admin/upload-local`) that writes
straight to disk — safe to do locally since there's no Vercel-style
request limit on your own machine. Leave both as `"supabase"` for
Vercel and production.

### Configuration to verify before going live

These are things only you can set correctly, not code changes:

1. **`NEXTAUTH_URL`** must exactly match the domain you're testing
   or deploying on — `https://your-preview.vercel.app` on Vercel,
   then `https://albustancommunities.com` for the final host. Set it
   as an environment variable in each environment's dashboard (don't
   rely on `.env` for deployed environments).
2. **`NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `STORAGE_PROVIDER`, `NEXT_PUBLIC_STORAGE_PROVIDER`**
   all need to be set in Vercel's Project Settings → Environment
   Variables (and again on the final host) — none of this is
   committed to git. The `NEXT_PUBLIC_*` ones are safe to expose (the
   anon key is meant to be public); `SUPABASE_SERVICE_ROLE_KEY` must
   never be one of them.
3. **Supabase Storage bucket** must be created and set **public**
   (read access), with a file-size limit and allowed MIME types
   configured on the bucket itself (this — not the app's own 4MB
   check — is the real, server-enforced ceiling on upload size). Keep
   the service role key in server-side env vars only.
4. **`DATABASE_URL` connection pooling**: serverless platforms (Vercel)
   can open many short-lived database connections under load. If
   your Postgres host offers a pooled connection string (e.g.
   Supabase's "Transaction" pooler on port 6543, Neon's pooled
   endpoint), use that for `DATABASE_URL` in production rather than a
   direct connection.
5. **SSL**: most managed Postgres providers require
   `?sslmode=require` on `DATABASE_URL` — check your provider's
   connection string format.
6. Run `npm run db:push` (or switch to `prisma migrate deploy` for a
   real migration history) and `npm run db:seed` against the
   **production** database before launch, the same way you did
   locally.
7. Existing local images uploaded before this change (under
   `/uploads/...`) won't exist on Vercel/production — re-upload those
   through the admin once `STORAGE_PROVIDER=supabase` is configured,
   since they only ever existed on your local machine's disk.

### Known limitations (not blockers, worth knowing)

- Login rate limiting (see "Admin auditing & security hardening"
  below) is in-memory — a best-effort deterrent, not a hard
  guarantee, since it resets on restart and isn't shared across
  multiple server instances. Revisit with a shared store (Redis,
  Vercel KV, etc.) if this ever runs somewhere that matters.
- Blog content is plain text (paragraphs split on blank lines), not
  rich text/Markdown — intentional, to avoid pulling in an editor
  dependency unasked. Easy to upgrade later if you want richer
  formatting.
- No spam protection (honeypot/CAPTCHA/rate limiting) on the public
  contact and inquiry forms yet — low risk for a low-traffic new
  site, but worth adding before the domain gets significant public
  traffic.

## All 10 phases are now complete

Every phase from the original build spec is implemented: foundation
and design system, homepage, About Us, projects + details, admin
auth + Project CMS, Blog + Blog CMS, Contact + inquiries, the
floating contact widget, Website Settings, and the final
responsive/SEO/performance/accessibility/security pass. What's left
is genuinely deployment-only configuration — see "Configuration to
verify before going live" above and the notes below — not features
or code.

## Placeholder data notice

No real company information (contact details, project names, history,
leadership, etc.) has been invented anywhere in this codebase. Every
placeholder is clearly labeled as such in `src/lib/constants.ts` and
in on-page copy. The admin login credentials are whatever you set in
your own `.env` — nothing is hard-coded.

## Lead management upgrade

The Phase 7 `ContactInquiry` system was upgraded in place into a
simple lead management system — no parallel/duplicate system was
built, and every existing inquiry row and public-facing behavior was
kept.

- **Database**: `ContactInquiry` gained `inquiryType` (set on the
  public form), and admin-managed `leadSource`, `propertyType`,
  `budget`, `customerNotes`, and `followUpDate`, plus `updatedAt`.
  `InquiryStatus` is now `new` / `contacted` / `follow_up` /
  `converted` / `closed` — `in_progress` was renamed to `follow_up`
  and `converted` was added to distinguish a won lead from one that's
  simply closed out.
- **Public forms** (`ContactForm`, `InquiryForm`): both gained an
  "Inquiry Type" select (General / Buying / Site Visit / Pricing /
  Other); every other field is unchanged. Every public submission is
  tagged `leadSource: "website"` automatically.
- **Admin Inquiries** (`/admin/inquiries`, now titled "Leads &
  Inquiries"): status tabs updated for the new pipeline, plus a search
  box (name/email/phone/subject) and Project / Lead Source / date-range
  filters, all server-rendered via URL query params — same pattern as
  the blog page's search/filter, so it works without JavaScript. Each
  lead card gained a "Manage lead" panel to set lead source, property
  type, budget, follow-up date, and internal customer notes, and a
  follow-up badge (due today / overdue) alongside the status badge.
- **Dashboard**: the Inquiries stat tiles now reflect the 5-status
  pipeline, plus a "Follow-ups Due Today" / "Follow-ups Overdue" tile
  pair.
- **Email notifications**: explicitly out of scope for this pass — no
  email library, credentials, or send call exist anywhere in this
  codebase. Every inquiry still saves to the CMS exactly as before;
  wiring up outbound notification email is a separate, later task.

## Sales team & lead assignment

Added a new, separate `SalesEmployee` concept (name/phone/email/designation/active
— no login, no password) so leads can be assigned to a person without
touching `AdminUser` or the existing admin auth at all.

- **Database**: new `SalesEmployee` model, plus `assignedToId` on
  `ContactInquiry` — a real foreign key (unlike the soft
  `projectId`/`projectName` reference) since sales employees live
  inside this same app. `onDelete: SetNull` so a stray deletion can
  never take inquiry data down with it, though the admin UI only ever
  offers activate/deactivate, never delete.
- **Admin "Sales Team"** (`/admin/sales-team`, new sidebar entry):
  list, add, edit, and an Active/Inactive toggle pill — same
  list/form/table pattern as Blog (`BlogTable`/`BlogForm`), including
  the same `useActionState` + field-error convention and a
  `useTransition`-driven toggle that needs no page reload.
- **Assigning leads**: each inquiry card in `/admin/inquiries` gained
  an "Assigned To" select (same immediate-fire pattern as the Status
  select) — choosing a name assigns/reassigns, choosing "Unassigned"
  removes the assignment; one server action
  (`updateInquiryAssignment`) covers all three. Deactivated employees
  still appear (marked "(Inactive)") so an old assignment stays
  visible and reassignable rather than disappearing.
- **Filtering**: the inquiries page gained an "Assigned To" filter
  (Everyone / Unassigned / a specific employee), alongside the
  existing status/project/source/date filters.
- **Dashboard**: a new "Sales Team" stats section (Total/Active/Inactive),
  and an "Unassigned Leads" tile next to the follow-up tiles (counts
  leads with no assignee, excluding Converted/Closed — the same
  "still actionable" convention as the follow-up counts).

## Testimonials & blog content upgrade

Added a new `Testimonial` model/admin section and connected it to the
homepage, and upgraded the blog CMS's content editor and per-post SEO
— all additive; no existing blog posts were touched or need migrating.

- **Testimonials** (`/admin/testimonials`, new sidebar entry): add,
  edit, delete, publish/unpublish, and reorder (↑/↓ swap the `order`
  field with the neighboring row — same pattern as `HeroSlide`/`ProjectFaq`).
  Each testimonial holds customer name, an optional photo (uploaded
  the same direct-to-Supabase way as every other admin image field,
  falls back to initials if none is set), an optional designation, the
  testimonial text, and an optional "Related project" — a real foreign
  key to `Project` (`onDelete: SetNull`, unlike `ContactInquiry`'s soft
  `projectId`/`projectName` reference, since a testimonial is ordinary
  admin-managed content, not a historical record of a public
  submission).
- **Homepage**: a new "What our customers say" section, shown between
  "What guides how we build" and the closing CTA, following the exact
  same double-guard pattern (`homepageSettings.testimonialsSectionEnabled && testimonials.length > 0`)
  as every other optional homepage section — with its own toggle in
  `/admin/homepage` → Homepage Sections.
- **Blog content editor**: the plain textarea was replaced with a
  Markdown editor (`MarkdownEditor` — toolbar for bold/italic/headings/
  quote/lists/links, plus a Write/Preview toggle rendered with the same
  `react-markdown` + `remark-gfm` pipeline the public post page uses,
  so the preview matches exactly). `BlogPost.content` is still just a
  `String` column — every existing post's plain text (paragraphs
  separated by a blank line) is already valid Markdown, so it renders
  completely unchanged; nothing needed converting.
- **Blog SEO fields**: optional `seoTitle`, `metaDescription`, and
  `ogImageUrl` on `BlogPost`, each falling back to the existing
  title/excerpt/featured image when left blank — same fallback
  convention `WebsiteSettings.seoTitle` already uses site-wide. Wired
  into the post page's `generateMetadata`.
- Shared typography mapping for rendered Markdown lives in one place
  (`src/components/ui/markdownComponents.tsx`) so the admin preview
  and the public post page can never drift out of sync with each
  other.

## SEO system upgrade

Extended the existing SEO setup (per-post fields, `robots.ts`,
`sitemap.ts`, `WebsiteSettings.seoTitle`) rather than replacing any of
it, and fixed a real, pre-existing bug found along the way.

- **Important fix — `proxy.ts` was in the wrong location and had
  never actually run.** Next.js discovers the proxy/middleware
  convention file relative to the `app` directory's *parent*, not the
  true project root. Since this project's `app` lives at `src/app`,
  the file has to be `src/proxy.ts` — it was sitting at the project
  root instead, so Next silently never bundled it (confirmed: the
  production build's route summary showed no `Proxy (Middleware)`
  line, and `.next/server/middleware-manifest.json` was empty).
  Practically, this meant the `/admin/*` NextAuth guard it was meant
  to provide was dead code the whole time — the server-side
  `getServerSession` check in `(dashboard)/layout.tsx` (correctly
  described in its own comment as "defense in depth") was in fact the
  *only* thing guarding the admin area. Moved the file to
  `src/proxy.ts`; both layers are now genuinely active, verified by a
  clean rebuild showing `ƒ Proxy (Middleware)` in the build output and
  by hitting `/admin/projects` unauthenticated and getting a real
  redirect to `/admin/login`.
- **Project SEO fields**: `Project` gained the same optional
  `seoTitle`/`metaDescription`/`ogImageUrl` fields `BlogPost` already
  had, plus new `canonicalUrl` and `noIndex` fields — added to both
  models (`BlogPost` didn't have canonical/noIndex before this pass).
  Same fallback convention throughout: each field falls back to the
  corresponding content field (name/shortDescription/coverImage, or
  title/excerpt/featuredImage) when left blank. Wired into both
  detail pages' `generateMetadata` (`alternates.canonical`,
  conditional `robots: { index: false }`).
- **`metadataBase`** added to the root layout — required as soon as
  any page sets a relative `alternates.canonical` (Next errors the
  build on a relative URL-based metadata field without it). Uses a
  new shared `src/lib/seo.ts` (`getBaseUrl()`), replacing what used to
  be the same function body copy-pasted independently in `robots.ts`
  and `sitemap.ts`.
- **SEO Redirect Manager** (`/admin/redirects`, new sidebar entry):
  add/edit/delete/enable-disable admin-managed redirects (backed by a
  new `Redirect` model: `fromPath` unique, `toPath`, `kind`
  permanent/temporary → real 301/302 status codes, `enabled`).
  `next.config`'s static `redirects()` can't change without a
  rebuild+redeploy, so these are enforced at request time from
  `src/proxy.ts` instead — the documented Next.js pattern for
  DB-driven redirects. To avoid a Postgres round trip on every public
  request (Next's own Proxy docs: "not intended for slow data
  fetching"), the enabled-redirects list is loaded into an in-memory
  map with a 60s TTL (`src/lib/redirects.ts`) rather than queried
  per-request — a new redirect can take up to a minute to take effect
  on a given server instance, a deliberate trade-off documented in
  that file. `/admin` and `/api` paths are excluded from redirect
  matching (and rejected outright if entered as a "from" path) so a
  redirect can never break admin access.
- **Sitemap**: now excludes any project/post with `noIndex` set — a
  URL listed in the sitemap while also telling search engines not to
  index it is a known anti-pattern. Already-correct behavior kept
  as-is: published-only filtering, `lastModified`/`changeFrequency`/
  `priority` on every entry.
- **Admin/private pages not indexed**: `robots.txt` already
  disallowed `/admin` and `/api` (unchanged); added a new
  `src/app/admin/layout.tsx` (metadata-only, no markup/auth logic)
  that sets `robots: { index: false, follow: false }` across the
  entire `/admin` subtree — defense-in-depth, since a robots.txt
  disallow alone stops crawling but doesn't guarantee an
  already-linked URL is never indexed.

## Admin auditing & security hardening

Added Activity Logs (a real feature this time, independent of the
role-based access control this repo briefly had and then had removed
— logging every consequential action doesn't require a role system,
just a signed-in admin) and fixed every concrete issue a full security
audit turned up. Nothing here re-introduces multi-role permissions.

- **Activity Logs** (`/admin/activity-logs`, new sidebar entry,
  viewable/filterable by any signed-in admin — same single-role model
  as the rest of the CMS): a new `ActivityLog` model, and one shared
  `logActivity()` helper (`src/lib/activityLog.ts`) called from every
  create/update/delete/publish/unpublish across all ten `actions.ts`
  files — Projects, Inventory, Payment Plans, Project FAQs, Blog,
  Gallery, Homepage (+ Hero), Testimonials, Leads/Inquiries, Sales
  Team, Redirects, and Settings. `adminEmail` is denormalized onto
  each row so an entry stays readable even if the `AdminUser` who made
  it is later deleted. The admin page filters by action type,
  resource, date range, and a free-text search over the admin
  email/description — capped at the 200 most recent matching entries
  (an audit viewer, not a paginated export tool). Pure reorders
  (move-up/down) aren't logged — not consequential enough to be worth
  the noise.
- **Security audit findings, all fixed**:
  - Two admin upload API routes (`upload-url`, `upload-local`) were
    forwarding raw internal error messages (Supabase SDK errors,
    exception text) straight into the JSON response body. Both now
    log the real error server-side (`console.error`) and return a
    generic message to the client.
  - `upload-local`'s route unconditionally wrote to local disk with
    no check that the server was actually configured for local
    storage (`STORAGE_PROVIDER=local`) — meaning a misconfigured
    production env could silently write to Vercel's ephemeral
    filesystem instead of erroring. It now checks and rejects if the
    server isn't set to `"local"`.
  - Three admin actions accepted free-text with no length validation
    (gallery photo captions, hero slide alt text, and a lead's
    budget/customer-notes fields, the last of which is called with a
    plain object rather than `FormData` and so has no Zod parse step
    at all upstream). Gallery/hero now reject overly long input with
    a clear error; the lead fields are clamped server-side since that
    call site has no field-level error display to show a rejection.
  - NextAuth session lifetime was left at the framework's 30-day
    default — tightened to 12 hours (`src/lib/auth.ts`), appropriate
    for an admin backend rather than a consumer app.
  - Added basic login rate limiting: 5 failed attempts locks that
    email out for 15 minutes (in-memory — see "Known limitations"
    above for why that's a soft guarantee, not a hard one).
  - `.env.example` was missing `DIRECT_URL` (required by
    `prisma.config.ts` for every CLI schema operation) despite it
    being required in the real `.env` — added, with an explanation of
    when it differs from `DATABASE_URL`.
  - Added a missing `@@index([adminEmail])` to the new `ActivityLog`
    model while touching the schema for it.
- **Confirmed already correct, no change needed**: every admin API
  route and every exported server action requires an authenticated
  session (verified exhaustively, not spot-checked); zero raw SQL
  anywhere (`$queryRaw`/`$executeRaw` — everything goes through
  Prisma's query builder); the Supabase service-role key is only ever
  referenced in server-only files and never reaches the browser
  client (which uses only the public anon key); `.gitignore` covers
  `.env` and `.env*.local`; foreign-key columns all have matching
  indexes; the schema is internally consistent with no dangling
  fields left over from the RBAC add-then-revert.

