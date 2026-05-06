# Architecture

**Analysis Date:** Tue May 05 2026

## Pattern Overview

**Overall:** Next.js App Router monolith with server-rendered route modules, centralized server actions, and a Prisma-backed persistence layer.

**Key Characteristics:**
- Route-first architecture under `src/app/`, with URL groups split into `src/app/(auth)/` and `src/app/(private)/`.
- Business mutations are centralized in `src/app/actions.ts` and invoked from form `action` props in page modules such as `src/app/(auth)/login/page.tsx` and `src/app/(private)/transactions/page.tsx`.
- Data access is direct from route modules and actions into Prisma via `src/lib/prisma.ts`; there is no intermediate service or repository layer.

## Layers

**Routing and Layout Layer:**
- Purpose: Define URLs, top-level rendering, and authenticated vs unauthenticated shells.
- Location: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/**/*`, `src/app/(private)/**/*`
- Contains: App Router layouts, page components, route-group boundaries, form markup, URL query handling.
- Depends on: `next/navigation`, `next/link`, `@/app/actions`, `@/lib/*`, `@/components/*`.
- Used by: Next.js runtime as the application entry surface.

**Mutation Layer:**
- Purpose: Execute all writes, redirects, validation, and cache invalidation.
- Location: `src/app/actions.ts`
- Contains: Authentication flows, password reset flow, category CRUD, transaction CRUD, recurring carry-forward logic, installment splitting helpers.
- Depends on: `@/lib/auth`, `@/lib/prisma`, `@/lib/validators`, `@/lib/email`, `@/lib/format`, Prisma enums from `src/generated/prisma/client.ts`.
- Used by: Forms in `src/app/(auth)/*.tsx`, `src/app/(private)/categories/page.tsx`, and `src/app/(private)/transactions/page.tsx`.

**Data Access Layer:**
- Purpose: Create and share the Prisma client connected through the Neon/PostgreSQL adapter configuration.
- Location: `src/lib/prisma.ts`
- Contains: Singleton Prisma client bootstrapping, `DATABASE_URL` guard, development global reuse.
- Depends on: `@prisma/adapter-neon`, generated client at `src/generated/prisma/client.ts`, environment variables.
- Used by: `src/app/actions.ts`, `src/lib/auth.ts`, `src/app/(private)/**/*.tsx`, `src/app/(auth)/reset-password/[token]/page.tsx`.

**Domain Utility Layer:**
- Purpose: Hold pure logic and reusable helpers outside page modules.
- Location: `src/lib/format.ts`, `src/lib/recommendations.ts`, `src/lib/annual-projection.ts`, `src/lib/constants.ts`, `src/lib/validators.ts`
- Contains: Date/amount formatting, monthly recommendation rules, annual projection calculations, default categories, Zod schemas.
- Depends on: Prisma enums and standard library only.
- Used by: Route modules, server actions, and chart components.

**Authentication and Session Layer:**
- Purpose: Resolve current user, enforce private access, and manage cookie-backed sessions.
- Location: `src/lib/auth.ts`
- Contains: `getOptionalSession`, `verifySession`, `redirectIfAuthenticated`, `createSession`, `destroySession`.
- Depends on: `next/headers`, `next/navigation`, `react` cache, `@/lib/prisma`.
- Used by: `src/app/page.tsx`, auth pages in `src/app/(auth)/*`, private layout in `src/app/(private)/layout.tsx`, and private pages.

**Presentation Component Layer:**
- Purpose: Encapsulate reusable UI elements that pages compose.
- Location: `src/components/submit-button.tsx`, `src/components/category-chart.tsx`, `src/components/annual-projection-chart.tsx`
- Contains: Client submit state button, Recharts donut chart, custom SVG annual chart.
- Depends on: React client hooks or shared formatting helpers.
- Used by: Dashboard, annual dashboard, auth forms, categories page, transactions page.

**Persistence Schema Layer:**
- Purpose: Define relational model and generated client output.
- Location: `prisma/schema.prisma`, `prisma/migrations/*`, generated output in `src/generated/prisma/*`
- Contains: `User`, `Session`, `PasswordResetToken`, `Category`, and `Transaction` models plus enums and migrations.
- Depends on: Prisma CLI/runtime.
- Used by: Generated client imports across `src/app/actions.ts`, `src/lib/prisma.ts`, and pages that import enums.

## Data Flow

**Authentication and Access Flow:**

1. `src/app/page.tsx` calls `getOptionalSession` from `src/lib/auth.ts` and redirects to `/dashboard` or `/login`.
2. Auth pages such as `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` post forms to actions in `src/app/actions.ts`.
3. Actions validate input with schemas from `src/lib/validators.ts`, read/write `User` and `Session` records through `src/lib/prisma.ts`, then set the `finance_session` cookie via `createSession` in `src/lib/auth.ts`.
4. Private pages and `src/app/(private)/layout.tsx` call `verifySession` from `src/lib/auth.ts`, which redirects unauthenticated requests to `/login`.

**Monthly Finance Flow:**

1. `src/app/(private)/transactions/page.tsx` and `src/app/(private)/categories/page.tsx` load user-scoped Prisma data directly.
2. Forms submit to `saveCategoryAction`, `saveTransactionAction`, `deleteCategoryAction`, `deleteTransactionAction`, or `carryRecurringTransactionsAction` in `src/app/actions.ts`.
3. Actions validate with `src/lib/validators.ts`, enforce ownership by `session.user.id`, persist through Prisma, then call `revalidatePath` for `/categories`, `/transactions`, `/dashboard`, and `/dashboard/anual`.
4. Redirects return the browser to the canonical page route after mutation.

**Dashboard Reporting Flow:**

1. `src/app/(private)/dashboard/page.tsx` reads `month` and `category` from `searchParams` using `getSingleParam` and `getMonthRange` from `src/lib/format.ts`.
2. The page queries categories and monthly transactions through Prisma.
3. It computes income, expense, balance, and per-category totals inline, then calls `getMonthlyPlan` from `src/lib/recommendations.ts`.
4. The page renders summary cards, recent transactions, and the client chart in `src/components/category-chart.tsx`.

**Annual Projection Flow:**

1. `src/app/(private)/dashboard/anual/page.tsx` resolves `year`, `category`, and `chartType` from query params.
2. The page loads year transactions and recurring expense history with Prisma.
3. `buildAnnualProjection` in `src/lib/annual-projection.ts` merges actuals with projected recurring expenses by chain root.
4. The result is rendered into the custom visualization component `src/components/annual-projection-chart.tsx` and supporting summary/table UI.

**State Management:**
- Server state is fetched directly inside async page components under `src/app/`.
- Mutation state is handled through server actions in `src/app/actions.ts` and `useFormStatus` in `src/components/submit-button.tsx`.
- UI filter state is URL-driven via `searchParams` in `src/app/(private)/dashboard/page.tsx`, `src/app/(private)/dashboard/anual/page.tsx`, `src/app/(private)/transactions/page.tsx`, and `src/app/(private)/categories/page.tsx`.
- Session state is cookie-backed and resolved server-side in `src/lib/auth.ts`.

## Key Abstractions

**Server Action Hub:**
- Purpose: Keep all write-side application behaviors in one server-only module.
- Examples: `src/app/actions.ts`
- Pattern: A single `'use server'` file exports action functions that parse `FormData`, validate, execute Prisma operations, revalidate, and redirect.

**Session Gate:**
- Purpose: Enforce authenticated access consistently across private routes.
- Examples: `src/lib/auth.ts`, `src/app/(private)/layout.tsx`, `src/app/(private)/dashboard/page.tsx`
- Pattern: Cached session lookup + redirect-based guard.

**URL-Scoped Route Groups:**
- Purpose: Separate public/auth pages from authenticated application pages without changing final URLs.
- Examples: `src/app/(auth)/login/page.tsx`, `src/app/(private)/transactions/page.tsx`
- Pattern: App Router group folders organize layout and access rules.

**Pure Domain Calculators:**
- Purpose: Isolate deterministic business calculations away from JSX.
- Examples: `src/lib/recommendations.ts`, `src/lib/annual-projection.ts`, `src/lib/format.ts`
- Pattern: Stateless functions with typed inputs and derived outputs.

**Generated Prisma Boundary:**
- Purpose: Share database enums and typed client from the generated output path.
- Examples: `src/generated/prisma/client.ts`, imports in `src/app/actions.ts` and `src/lib/validators.ts`
- Pattern: Prisma schema generates client into `src/generated/prisma/`, then app code imports through `@/generated/prisma/client`.

## Entry Points

**Root Request Router:**
- Location: `src/app/page.tsx`
- Triggers: Requests to `/`
- Responsibilities: Resolve session presence and redirect to `/dashboard` or `/login`.

**Global App Shell:**
- Location: `src/app/layout.tsx`
- Triggers: Every route render
- Responsibilities: Load fonts, global CSS from `src/app/globals.css`, root HTML shell, and metadata.

**Private App Shell:**
- Location: `src/app/(private)/layout.tsx`
- Triggers: Requests to `/dashboard`, `/dashboard/anual`, `/transactions`, `/categories`
- Responsibilities: Verify session, render navigation, show current user, and expose logout form.

**Mutation Surface:**
- Location: `src/app/actions.ts`
- Triggers: Form submissions from auth and private pages
- Responsibilities: Validate input, mutate Prisma models, manage sessions, send password reset email, revalidate routes, redirect.

**Database Schema Entry Point:**
- Location: `prisma/schema.prisma`
- Triggers: Prisma generation and migration workflows from `package.json` and `prisma.config.ts`
- Responsibilities: Define models, enums, relations, and generated client output path.

## Error Handling

**Strategy:** Redirect-driven user-facing errors for form flows, hard throws for missing infrastructure, and fallback empty states in charts/pages.

**Patterns:**
- `src/app/actions.ts` uses local `fail()` and `succeed()` helpers to redirect with `error` or `success` query strings.
- `src/lib/prisma.ts` and `src/lib/email.ts` throw immediately when required environment configuration is missing.
- `src/app/(auth)/reset-password/[token]/page.tsx` renders an invalid-link screen when the token lookup fails instead of throwing.
- `src/components/category-chart.tsx` and `src/components/annual-projection-chart.tsx` render placeholder states when there is no chartable data.

## Cross-Cutting Concerns

**Logging:** No application logging abstraction is defined in `src/`; the codebase relies on redirects, thrown errors, and UI feedback rather than structured logs.

**Validation:** Server-side validation is centralized in Zod schemas in `src/lib/validators.ts` and applied from `src/app/actions.ts` before Prisma writes.

**Authentication:** Cookie/session authentication is implemented in `src/lib/auth.ts`, enforced by `verifySession`, and used by the private route group rooted at `src/app/(private)/layout.tsx`.

---

*Architecture analysis: Tue May 05 2026*
