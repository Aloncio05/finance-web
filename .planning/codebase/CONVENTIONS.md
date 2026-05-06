# Coding Conventions

**Analysis Date:** Tue May 05 2026

## Naming Patterns

**Files:**
- Use lowercase kebab-case for reusable modules and components in `src/lib/format.ts`, `src/lib/annual-projection.ts`, `src/components/submit-button.tsx`, and `src/components/category-chart.tsx`.
- Use Next.js App Router reserved names for route files: `page.tsx`, `layout.tsx`, and `actions.ts` in `src/app/`.
- Use route groups for access segmentation in `src/app/(auth)/` and `src/app/(private)/`, and dynamic segment folders for params such as `src/app/(auth)/reset-password/[token]/page.tsx`.

**Functions:**
- Use camelCase for helpers and actions: `formatCurrencyFromCents` in `src/lib/format.ts`, `getMonthlyPlan` in `src/lib/recommendations.ts`, `verifySession` in `src/lib/auth.ts`, and `saveTransactionAction` in `src/app/actions.ts`.
- Suffix server actions with `Action` and export them directly from `src/app/actions.ts`.
- Prefix boolean helpers with `is` or `has` when the value is a predicate, e.g. `isLocalAppUrl` in `src/app/actions.ts`.

**Variables:**
- Use descriptive camelCase names for Prisma results and derived state: `transactionToEdit`, `expenseCategories`, `monthlyPlan`, and `existingCopies` in `src/app/(private)/*/page.tsx` and `src/app/actions.ts`.
- Use UPPER_SNAKE_CASE for module constants such as `PASSWORD_RESET_MAX_AGE_MINUTES` and `LOCAL_APP_URL` in `src/app/actions.ts`, `SESSION_COOKIE` in `src/lib/auth.ts`, and `CHART_WIDTH` in `src/components/annual-projection-chart.tsx`.

**Types:**
- Use PascalCase for aliases and props types: `TransactionsPageProps` in `src/app/(private)/transactions/page.tsx`, `RecommendationSummary` in `src/lib/recommendations.ts`, and `AnnualProjectionChartProps` in `src/components/annual-projection-chart.tsx`.
- Use inline `type` aliases close to the consuming file instead of shared interfaces for page-local data shapes, e.g. `DashboardTransaction` and `ExpenseByCategory` in `src/app/(private)/dashboard/page.tsx`.

## Code Style

**Formatting:**
- Primary enforced formatter is not detected. No `.prettierrc*` or `biome.json` file is present at the project root.
- `eslint-config-next` is the only automated style tooling detected in `eslint.config.mjs`.
- The codebase mixes double quotes in `src/app/actions.ts`, `src/lib/auth.ts`, and `src/app/(private)/dashboard/page.tsx` with single quotes in `src/components/submit-button.tsx`, `src/components/category-chart.tsx`, and parts of `src/app/(auth)/register/page.tsx`.
- JSX tends to wrap long props across multiple lines and keep Tailwind classes inline. Follow the multiline style used in `src/app/(private)/transactions/page.tsx` and `src/app/(auth)/login/page.tsx`.
- Indentation is mostly two spaces, but quality is inconsistent in `src/components/category-chart.tsx` and `src/app/(auth)/register/page.tsx`. Match the surrounding file when editing instead of introducing a third style.

**Linting:**
- Use ESLint via `bun run lint` in this environment, which maps to `eslint` in `package.json`.
- Extend Next.js core web vitals and TypeScript presets from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` in `eslint.config.mjs`.
- Ignore build artifacts through `globalIgnores` in `eslint.config.mjs`: `.next/**`, `out/**`, `build/**`, and `next-env.d.ts`.
- Type strictness is enabled in `tsconfig.json` with `strict: true`, `moduleResolution: "bundler"`, and `noEmit: true`.

## Import Organization

**Order:**
1. Framework or platform imports first, e.g. `next/navigation`, `next/link`, `react`, and `node:crypto` in `src/app/actions.ts`, `src/lib/auth.ts`, and route pages.
2. Internal alias imports second, using `@/` paths such as `@/lib/auth`, `@/components/submit-button`, and `@/generated/prisma/client`.
3. Relative stylesheet imports are kept local to root layout, e.g. `./globals.css` in `src/app/layout.tsx`.

**Path Aliases:**
- Use the `@/*` alias defined in `tsconfig.json` for all internal imports under `src/`.
- Prefer alias imports over deep relative paths. This pattern is consistent across `src/app/actions.ts`, `src/app/(private)/dashboard/page.tsx`, and `src/lib/auth.ts`.

## Error Handling

**Patterns:**
- Validate user input with Zod `safeParse` before business logic. This is the default pattern in `src/app/actions.ts` using schemas from `src/lib/validators.ts`.
- Fail fast by redirecting with encoded query-string messages through `fail()` and `succeed()` in `src/app/actions.ts`.
- Guard authenticated actions and pages with `verifySession()` from `src/lib/auth.ts`.
- Throw explicit configuration errors for required environment variables in server-only modules such as `src/lib/prisma.ts` and `src/lib/email.ts`.
- Use broad `catch` blocks only to convert infrastructure failures into user-facing redirects, as seen in `registerAction`, `saveCategoryAction`, and forgot-password email delivery in `src/app/actions.ts`.

## Logging

**Framework:** None detected.

**Patterns:**
- No `console.*` calls were detected in `src/**/*.ts` or `src/**/*.tsx`.
- Prefer returning user-visible errors or throwing exceptions over ad hoc logging. Existing behavior relies on redirects, thrown configuration errors, and Next.js runtime errors in `src/app/actions.ts`, `src/lib/prisma.ts`, and `src/lib/email.ts`.

## Comments

**When to Comment:**
- Keep comments sparse and only for non-obvious behavior. Current examples are short justification comments such as `// Keep login working even if a legacy duplicate prevents normalization.` in `src/app/actions.ts` and ignore comments in `eslint.config.mjs`.
- Prefer expressive helper names over explanatory comments, e.g. `addMonthsPreservingDay`, `splitAmountIntoInstallments`, and `getForgotPasswordDeliveryErrorMessage` in `src/app/actions.ts`.

**JSDoc/TSDoc:**
- Not used in application code. No JSDoc or TSDoc blocks were detected in `src/`.

## Function Design

**Size:**
- Utility functions are small and single-purpose in `src/lib/format.ts`, `src/lib/recommendations.ts`, and `src/lib/auth.ts`.
- Server action orchestration is centralized in a single large module, `src/app/actions.ts`, where helpers are colocated with exported actions. When adding new actions, follow the existing helper-first structure unless the file becomes unmanageable.

**Parameters:**
- Page components accept typed prop objects such as `TransactionsPageProps` and `LoginPageProps`.
- Helpers prefer primitive parameters over option objects when the function is local and narrow in scope, e.g. `parseAmountToCents(rawValue: string)` in `src/lib/format.ts` and `buildPlan(...)` in `src/lib/recommendations.ts`.
- Reusable components accept explicit props types rather than `any`, e.g. `SubmitButtonProps` in `src/components/submit-button.tsx` and `CategoryChartProps` in `src/components/category-chart.tsx`.

**Return Values:**
- Formatting and derivation helpers return plain values or lightweight objects, e.g. `getMonthRange()` and `getYearRange()` in `src/lib/format.ts`.
- Auth redirects intentionally use `never`-style control flow through `redirect()` in `fail()` and `succeed()` inside `src/app/actions.ts`.
- Empty states are usually rendered as alternate JSX branches instead of returning `null`, as seen in `src/components/category-chart.tsx` and `src/components/annual-projection-chart.tsx`.

## Module Design

**Exports:**
- Prefer named exports for helpers, components, and actions: `export function SubmitButton`, `export const authSchema`, and `export async function loginAction`.
- Use a default export for Next.js page and layout entry points only, as in `src/app/page.tsx`, `src/app/layout.tsx`, and route `page.tsx` files.
- Mark server-only modules explicitly with `import "server-only";` where direct browser import must be prevented, as in `src/lib/auth.ts` and `src/lib/email.ts`.

**Barrel Files:**
- Not used. Imports resolve directly to concrete files such as `@/lib/format` and `@/components/submit-button`.

---

*Convention analysis: Tue May 05 2026*
