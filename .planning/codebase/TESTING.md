# Testing Patterns

**Analysis Date:** Thu Apr 23 2026

## Test Framework

**Runner:**
- Not detected.
- Config: Not detected. No `vitest.config.*`, `jest.config.*`, or test runner config file is present at the project root.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
npm run lint         # Only quality command currently defined in `package.json`
npm run build        # Compile-time validation via Next.js and TypeScript checks
Not applicable       # No watch-mode test command is defined
Not applicable       # No coverage command is defined
```

## Test File Organization

**Location:**
- No automated test files were detected. The glob `**/*.{test,spec}.{ts,tsx,js,jsx}` returned no results.
- Quality checks currently rely on source validation inside runtime code and on framework/tooling config in `package.json`, `eslint.config.mjs`, and `tsconfig.json`.

**Naming:**
- Not applicable. No `*.test.*` or `*.spec.*` files are present.

**Structure:**
```
No dedicated test directories or co-located test files detected.
```

## Test Structure

**Suite Organization:**
```typescript
// Not detected. Use this repo's existing validation-first action pattern as the baseline
// for future tests around `src/app/actions.ts` and helpers in `src/lib/*.ts`.
```

**Patterns:**
- Current correctness checks are embedded directly in server actions with Zod `safeParse()` and guard clauses in `src/app/actions.ts`.
- Shared validation logic is centralized in `src/lib/validators.ts`, which is the best entry point for future unit tests.
- Pure business helpers such as `parseAmountToCents` in `src/lib/format.ts`, `getMonthlyPlan` in `src/lib/recommendations.ts`, and `buildAnnualProjection` consumer flows in `src/app/(private)/dashboard/anual/page.tsx` are structured for deterministic tests, but none exist yet.

## Mocking

**Framework:** Not detected.

**Patterns:**
```typescript
// No mocking utilities are present in the repository.
// If tests are added, the highest-value seams to mock are:
// - `@/lib/prisma` in `src/app/actions.ts` and route pages
// - `next/navigation` redirects in `src/app/actions.ts` and `src/lib/auth.ts`
// - `next/headers` cookies in `src/lib/auth.ts`
// - `resend` delivery in `src/lib/email.ts`
```

**What to Mock:**
- External I/O boundaries only: Prisma client calls in `src/lib/prisma.ts`, Resend in `src/lib/email.ts`, and Next.js request primitives used by `src/lib/auth.ts`.
- Redirect side effects from `next/navigation` when testing `fail()` / `succeed()`-driven flows in `src/app/actions.ts`.

**What NOT to Mock:**
- Pure helper logic in `src/lib/format.ts`, `src/lib/recommendations.ts`, and `src/lib/annual-projection.ts`.
- Zod schemas in `src/lib/validators.ts`; validate them with real inputs instead of replacing them.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected. Existing source shapes suggest using small inline factories when tests are added:
// - form payloads matching `authSchema`, `categorySchema`, and `transactionSchema` in `src/lib/validators.ts`
// - transaction/category records matching Prisma selects used in `src/app/(private)/dashboard/page.tsx`
// - annual chart month arrays matching `AnnualProjectionMonth` in `src/components/annual-projection-chart.tsx`
```

**Location:**
- Not detected. No `fixtures`, `factories`, or test utility directories are present.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
Not applicable
```

## Test Types

**Unit Tests:**
- Not implemented.
- Highest-value unit targets are `src/lib/format.ts`, `src/lib/recommendations.ts`, `src/lib/validators.ts`, and the chart/math helpers in `src/components/annual-projection-chart.tsx`.

**Integration Tests:**
- Not implemented.
- Highest-value integration targets are server actions in `src/app/actions.ts`, especially authentication, password reset, category CRUD, transaction CRUD, installment splitting, and recurring transaction carry-forward behavior.

**E2E Tests:**
- Not used. No Playwright, Cypress, or similar framework is declared in `package.json`.

## Common Patterns

**Async Testing:**
```typescript
// No async test pattern is present yet.
// Existing async code that should drive future tests lives in:
// - `src/app/actions.ts` for server actions and redirects
// - `src/lib/auth.ts` for cookie/session flows
// - `src/lib/email.ts` for email delivery handling
```

**Error Testing:**
```typescript
// No error assertion pattern is present yet.
// Future tests should assert the repo's current contract:
// - invalid input is rejected by Zod schemas in `src/lib/validators.ts`
// - action failures redirect with encoded messages via `fail()` in `src/app/actions.ts`
// - missing config throws explicit errors in `src/lib/prisma.ts` and `src/lib/email.ts`
```

## Current Quality Signals and Gaps

- `npm run lint` exists in `package.json`, so linting is the only automated quality gate detected.
- `tsconfig.json` enables `strict: true`, which adds compile-time protection even without tests.
- No unit, integration, or E2E tests exist for the main business-critical flows in `src/app/actions.ts`.
- No tests protect authentication/session behavior in `src/lib/auth.ts`.
- No tests cover recurrent and installment transaction rules in `src/app/actions.ts`, which are the densest pieces of business logic.
- No tests cover chart calculations and annual projection rendering paths used by `src/app/(private)/dashboard/anual/page.tsx` and `src/components/annual-projection-chart.tsx`.
- No coverage reporting, watch mode, or CI-oriented test command is present in `package.json`.

---

*Testing analysis: Thu Apr 23 2026*
