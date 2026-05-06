# Codebase Structure

**Analysis Date:** Tue May 05 2026

## Directory Layout

```text
[project-root]/
├── src/                 # Application source: App Router pages, shared libs, generated Prisma client, components
├── prisma/              # Prisma schema and SQL migrations
├── public/              # Static assets served by Next.js
├── .planning/codebase/  # Generated codebase mapping documents
├── package.json         # Scripts and dependency manifest
├── next.config.ts       # Next.js runtime configuration
├── tsconfig.json        # TypeScript config and path alias
├── prisma.config.ts     # Prisma CLI datasource configuration
└── vercel.json          # Vercel build command override
```

## Directory Purposes

**`src/app/`:**
- Purpose: Own every route, layout, and server action.
- Contains: `layout.tsx`, `page.tsx`, `actions.ts`, route groups `src/app/(auth)/` and `src/app/(private)/`, plus `globals.css`.
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/actions.ts`, `src/app/(private)/layout.tsx`

**`src/app/(auth)/`:**
- Purpose: Hold unauthenticated entry flows.
- Contains: Login, register, forgot-password, and reset-password pages.
- Key files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/[token]/page.tsx`

**`src/app/(private)/`:**
- Purpose: Hold authenticated application screens behind the shared private layout.
- Contains: Dashboard, annual dashboard, transactions, and categories pages.
- Key files: `src/app/(private)/layout.tsx`, `src/app/(private)/dashboard/page.tsx`, `src/app/(private)/dashboard/anual/page.tsx`, `src/app/(private)/transactions/page.tsx`, `src/app/(private)/categories/page.tsx`

**`src/components/`:**
- Purpose: Reusable UI pieces used across pages.
- Contains: Charts and form button helpers.
- Key files: `src/components/submit-button.tsx`, `src/components/category-chart.tsx`, `src/components/annual-projection-chart.tsx`

**`src/lib/`:**
- Purpose: Shared server/domain utilities.
- Contains: Auth/session helpers, Prisma bootstrapping, email integration, validators, formatting, recommendations, annual projection logic, constants.
- Key files: `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/email.ts`, `src/lib/validators.ts`, `src/lib/format.ts`, `src/lib/recommendations.ts`, `src/lib/annual-projection.ts`

**`src/generated/prisma/`:**
- Purpose: Store the generated Prisma client within source control paths used by the app.
- Contains: Generated client, enums, model typings, Prisma internals.
- Key files: `src/generated/prisma/client.ts`, `src/generated/prisma/enums.ts`, `src/generated/prisma/models.ts`

**`prisma/`:**
- Purpose: Define database structure and migration history.
- Contains: `schema.prisma` and SQL migrations.
- Key files: `prisma/schema.prisma`, `prisma/migrations/20260415133107_init/migration.sql`, `prisma/migrations/20260415162935_recurring_expenses/migration.sql`

**`public/`:**
- Purpose: Static assets exposed by Next.js.
- Contains: SVG assets such as `public/vercel.svg` and `public/next.svg`.
- Key files: `public/vercel.svg`, `public/next.svg`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Root redirect entry for `/`.
- `src/app/layout.tsx`: Global HTML/body shell and metadata.
- `src/app/(private)/layout.tsx`: Authenticated shell and navigation.
- `src/app/actions.ts`: All server form handlers.
- `prisma/schema.prisma`: Data model source for the generated client.

**Configuration:**
- `package.json`: Scripts for `dev`, `build`, `start`, `lint`, Prisma deploy, and Vercel build.
- `tsconfig.json`: Strict TypeScript settings and `@/*` alias to `src/*`.
- `next.config.ts`: Turbopack root setting.
- `eslint.config.mjs`: Next.js ESLint presets and ignore overrides.
- `prisma.config.ts`: Prisma CLI datasource URL via `DIRECT_URL`.
- `vercel.json`: Build command override to `npm run vercel-build`.

**Core Logic:**
- `src/lib/auth.ts`: Session cookie lifecycle and access guards.
- `src/lib/prisma.ts`: Prisma singleton client.
- `src/lib/validators.ts`: Shared server-side schemas.
- `src/lib/recommendations.ts`: Monthly leftover allocation logic.
- `src/lib/annual-projection.ts`: Annual recurring-expense projection engine.

**Testing:**
- Not detected. No `*.test.*`, `*.spec.*`, or dedicated test directories were found in the inspected repository structure.

## Naming Conventions

**Files:**
- App Router route files use framework conventions: `page.tsx`, `layout.tsx`, `actions.ts`, and dynamic segments such as `src/app/(auth)/reset-password/[token]/page.tsx`.
- Shared modules use lowercase kebab-case filenames in `src/components/` and `src/lib/`, for example `src/components/annual-projection-chart.tsx` and `src/lib/annual-projection.ts`.

**Directories:**
- Route groups use parenthesized names for logical segmentation without affecting the URL, for example `src/app/(auth)/` and `src/app/(private)/`.
- Feature folders under `src/app/(private)/` mirror URL paths, for example `src/app/(private)/transactions/` for `/transactions` and `src/app/(private)/dashboard/anual/` for `/dashboard/anual`.

## Where to Add New Code

**New Feature:**
- Primary code: Add the page/layout surface under the relevant App Router path in `src/app/`; use `src/app/(private)/` for authenticated features and `src/app/(auth)/` for public auth flows.
- Tests: Not applicable in current structure. No established test directory is present.

**New Component/Module:**
- Implementation: Put reusable UI in `src/components/` and keep page-specific composition inside the owning `src/app/.../page.tsx` file.

**Utilities:**
- Shared helpers: Add pure shared logic to `src/lib/`; keep database schema changes in `prisma/schema.prisma`; rely on generated types from `src/generated/prisma/` rather than hand-written duplicates.

## Special Directories

**`src/generated/prisma/`:**
- Purpose: Generated Prisma client code consumed through `@/generated/prisma/client` imports.
- Generated: Yes
- Committed: Yes

**`prisma/migrations/`:**
- Purpose: SQL migration history for schema evolution.
- Generated: Yes
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Planning artifacts used by GSD workflows.
- Generated: Yes
- Committed: Yes, if the orchestrator stages planning output.

**`public/`:**
- Purpose: Public static asset directory.
- Generated: No
- Committed: Yes

---

*Structure analysis: Tue May 05 2026*
