# Coredex: local development

Coredex is a multi-tenant QR menu platform: each restaurant gets a menu at `/c/<slug>` and an admin at `/c/<slug>/admin`. The platform admin is at `/superadmin`.

Stack: Next.js 16 (App Router), React 19, Tailwind 3, Turso/libSQL, Cloudflare R2 for images.

## 1. Install

```bash
npm ci
```

## 2. Settings

Copy `.env.example` to `.env.local` and fill it in. For local work you can use a SQLite file instead of Turso, so nothing touches the live database:

```bash
TURSO_DATABASE_URL=file:local.db
JWT_SECRET=any-long-random-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Without `SMTP_*` settings, signup verification codes are printed in the terminal instead of emailed. Without `R2_*`, image uploads fail. Without AI keys, the AI features are unavailable; everything else works. AI model names are in `lib/ai/models.ts` and can be overridden in `.env.local` (see `.env.example`).

## 3. Database

```bash
node scripts/init-db.mjs             # creates or updates all tables; safe to re-run
npm run create-superadmin            # platform admin login
npx tsx scripts/seed-demo.ts         # optional: the "Sofra" demo menu at /c/demo
```

## 4. Run

```bash
npm run dev                           # http://localhost:3000
npx tsc --noEmit                      # type check
npm run lint                          # ESLint (Next.js rules)
npm test                              # unit tests in tests/ (no database needed)
```

## Where things are

| Path | What |
|---|---|
| `src/app/page.tsx`, `src/app/_landing/` | Marketing site (Arabic/English) |
| `src/app/signup/`, `src/app/(account)/` | Owner signup, sign-in and password reset |
| `src/app/c/[slug]/` | Guest menu (`(menu)/`, `_components/menu/`, `_lib/`) and owner admin (`admin/`) |
| `src/app/superadmin/` | Platform admin |
| `src/app/api/` | API routes (`c/[slug]/…` per restaurant, `superadmin/…`, `auth/…`, `ai/…`) |
| `lib/catalog/` | Menu queries, publishing, prices, dish options and menu import |
| `lib/ai/` | AI model names, AI photo jobs |
| `lib/qr/` | QR colour contrast check |
| `lib/plans.ts` | Plans, prices and limits |
| `lib/db/` | Schema (`schema-v2-multitenant.sql`) and migrations |
| `deploy/` | VPS deployment (see `deploy/README.md`) |
| `tests/` | Unit tests (`node:test` via tsx) |

Design tokens (Coredex Violet & Indigo) live in `src/app/globals.css` under `.menu` (guest menu) and `.platform` (site and dashboards), exposed to Tailwind as `menu-*` and `ui-*` colours.
