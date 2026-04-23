# Codebase Concerns

**Analysis Date:** Thu Apr 23 2026

## Tech Debt

**Monolithic server action layer:**
- Issue: `src/app/actions.ts` centralizes authentication, password reset, category CRUD, transaction CRUD, recurrence carry-over, redirect messaging, token hashing, date helpers, and installment logic in one 803-line file.
- Files: `src/app/actions.ts`
- Impact: Small changes have high regression risk, review scope is large, and cross-cutting bugs are harder to isolate.
- Fix approach: Split into focused modules such as `src/app/actions/auth.ts`, `src/app/actions/categories.ts`, and `src/app/actions/transactions.ts`, then move pure helpers into `src/lib/*` with direct unit coverage.

**Deployment and database documentation drift:**
- Issue: runtime code is wired for PostgreSQL + Neon via `@prisma/adapter-neon` and `provider = "postgresql"`, while the docs describe Turso/libSQL, local SQLite, and packages that are not present.
- Files: `package.json`, `src/lib/prisma.ts`, `prisma/schema.prisma`, `prisma.config.ts`, `README.md`, `DEPLOY_VERCEL.md`
- Impact: New environments are likely to be misconfigured, deploy instructions are unreliable, and operators may provision the wrong database stack.
- Fix approach: Pick one supported database path, align `README.md`, `DEPLOY_VERCEL.md`, `prisma.config.ts`, and `package.json`, then remove stale provider instructions.

**Prisma environment split is easy to misconfigure:**
- Issue: runtime Prisma uses `DATABASE_URL` in `src/lib/prisma.ts`, while Prisma CLI config uses `DIRECT_URL` in `prisma.config.ts`.
- Files: `src/lib/prisma.ts`, `prisma.config.ts`
- Impact: Local development, migrations, and production runtime can point to different databases without obvious feedback.
- Fix approach: Document and justify the split clearly or consolidate around one required connection strategy.

## Known Bugs

**Recurring carry-over can duplicate rows under concurrent submissions:**
- Symptoms: `carryRecurringTransactionsAction` checks for existing copies, then performs `createMany` without a transaction or unique guard on the copied month.
- Files: `src/app/actions.ts`, `prisma/schema.prisma`
- Trigger: Two requests for `carryRecurringTransactionsAction` for the same month/user can pass the existence check before either insert finishes.
- Workaround: Avoid repeated clicks; add a database-level uniqueness rule and wrap read/write steps in `prisma.$transaction`.

**Register flow can leave partially created accounts:**
- Symptoms: account creation and session creation are not transactional. If `createSession` fails after `prisma.user.create`, the code redirects to login only when `createdUserId` is set, but default categories and user creation have already committed.
- Files: `src/app/actions.ts`, `src/lib/auth.ts`
- Trigger: Database or cookie/session failure during `registerAction` after user creation.
- Workaround: Wrap user creation plus session bootstrap in a transaction boundary where possible, or make post-create recovery explicit.

**Password reset can finish in partial state:**
- Symptoms: password update, token consumption, token cleanup, and session revocation happen as separate operations.
- Files: `src/app/actions.ts`, `src/app/(auth)/reset-password/[token]/page.tsx`
- Trigger: Mid-request failure after password update but before token/session cleanup completes.
- Workaround: Use `prisma.$transaction` for the full reset sequence.

**Email normalization path hides legacy account conflicts:**
- Symptoms: login updates `user.email` to the submitted casing/value, but duplicate normalization failures are silently ignored.
- Files: `src/app/actions.ts`
- Trigger: Logging in with a legacy mixed-case duplicate dataset.
- Workaround: Replace silent catch with explicit remediation flow and add a one-time data cleanup migration.

## Security Considerations

**Session tokens are stored unhashed:**
- Risk: A database leak exposes live session bearer tokens directly because `Session.token` is stored as raw random hex, unlike password reset tokens which are hashed.
- Files: `prisma/schema.prisma`, `src/lib/auth.ts`
- Current mitigation: Cookie is `httpOnly` and only marked `secure` in production.
- Recommendations: Store a hash of the session token in `Session.token`, compare hashes on lookup, and rotate/expire aggressively.

**Authentication flows have no rate limiting or lockout:**
- Risk: `loginAction`, `registerAction`, `forgotPasswordAction`, and `resetPasswordAction` accept repeated attempts with no throttling.
- Files: `src/app/actions.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/[token]/page.tsx`
- Current mitigation: Input validation with Zod and generic success messaging for unknown forgot-password emails.
- Recommendations: Add per-IP and per-account throttling, temporary lockouts, and audit logging for auth events.

**Password policy is weak for a public auth system:**
- Risk: Passwords only require 6 characters.
- Files: `src/lib/validators.ts`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/reset-password/[token]/page.tsx`
- Current mitigation: Passwords are hashed with `bcryptjs` cost 12 in `src/app/actions.ts`.
- Recommendations: Raise minimum length, add stronger composition or breached-password checks, and surface policy consistently in the UI.

**Local password-reset flow exposes the reset link in the rendered page and query string:**
- Risk: In local mode, the reset URL is appended as `resetLink` and rendered back to the browser, which places a live token in browser history and logs.
- Files: `src/app/actions.ts`, `src/app/(auth)/forgot-password/page.tsx`
- Current mitigation: This path is only used when `APP_URL` resolves to localhost or `127.0.0.1`.
- Recommendations: Prefer server-side debug logging to the terminal or a short-lived dev-only copy action instead of including the token in the page URL.

## Performance Bottlenecks

**Dashboard pages load full result sets and aggregate in memory:**
- Problem: Monthly and annual screens fetch full matching transaction lists with `findMany` and then compute totals, category grouping, projections, and recent activity in application code.
- Files: `src/app/(private)/dashboard/page.tsx`, `src/app/(private)/dashboard/anual/page.tsx`, `src/lib/annual-projection.ts`
- Cause: No database-side aggregation, pagination, or materialized summaries.
- Improvement path: Move sums/grouping into Prisma aggregate queries, paginate history in `src/app/(private)/transactions/page.tsx`, and limit annual history to the minimum data needed.

**Annual projection repeatedly scans chains per month:**
- Problem: `buildAnnualProjection` builds recurring chains, then filters each chain for every month of the year.
- Files: `src/lib/annual-projection.ts`
- Cause: Nested loop plus repeated `filter` operations over in-memory history.
- Improvement path: Pre-index recurring transactions by month/root and compute projections in one pass.

## Fragile Areas

**Recurring transaction lifecycle:**
- Files: `src/app/actions.ts`, `src/app/(private)/transactions/page.tsx`, `src/lib/annual-projection.ts`, `prisma/schema.prisma`
- Why fragile: Recurrence, carried copies, installments, edit restrictions, and annual projection all depend on shared conventions across `recurrenceType`, `carriedFromId`, `installmentGroupId`, `installmentNumber`, and `installmentCount`.
- Safe modification: Change recurrence/installment fields together, verify both monthly and annual pages, and preserve database invariants before shipping.
- Test coverage: No automated tests detected for recurrence, carry-over, installment editing, or projection behavior.

**Password reset implementation depends on manual Prisma client typing:**
- Files: `src/app/actions.ts`, `src/app/(auth)/reset-password/[token]/page.tsx`
- Why fragile: Both files cast `prisma` to manually defined `PasswordResetTokenClient` types instead of using generated client types directly.
- Safe modification: Regenerate Prisma client types after schema changes and remove local client shims where possible.
- Test coverage: No automated tests detected for token lookup, expiry handling, or reset completion.

## Scaling Limits

**Transaction history pages assume low-volume personal data:**
- Current capacity: Suitable for small per-user datasets because pages read whole month/year slices directly.
- Limit: As transaction volume grows, `findMany` queries plus server-side filtering/rendering will increase response time and memory usage.
- Scaling path: Add pagination, selective field projections, aggregate queries, and archive/reporting strategies for older records.

## Dependencies at Risk

**Framework/runtime stack is ahead of typical ecosystem defaults:**
- Risk: `next@16.2.3`, `react@19.2.4`, `@prisma/client@7.7.0`, and custom generated Prisma output increase the chance of ecosystem incompatibilities and stale examples in project docs.
- Impact: Upgrades, troubleshooting, and onboarding are harder; generated-type mismatches are already visible around password reset client typing.
- Migration plan: Keep framework docs current in repo guidance, pin compatible versions intentionally, and verify generated Prisma APIs after each upgrade.

## Missing Critical Features

**Automated test suite:**
- Problem: No `*.test.*`, `*.spec.*`, or test runner config was detected.
- Blocks: Safe refactoring of `src/app/actions.ts`, recurrence logic in `src/lib/annual-projection.ts`, and auth flows in `src/lib/auth.ts`.

**Operational protections for auth endpoints:**
- Problem: No rate limiting, abuse controls, or auth event logging is visible in the codebase.
- Blocks: Hardening the public login and password-reset surface for internet exposure.

**Database safeguards for recurrence uniqueness:**
- Problem: No schema-level uniqueness prevents duplicate carried transactions for the same source/month.
- Blocks: Making `carryRecurringTransactionsAction` idempotent under retries and concurrent requests.

## Test Coverage Gaps

**Authentication and session lifecycle:**
- What's not tested: Registration, login, logout, cookie/session creation, duplicate-email resolution, and password reset flows.
- Files: `src/app/actions.ts`, `src/lib/auth.ts`, `src/lib/email.ts`
- Risk: Regressions can break sign-in, leak inconsistent auth state, or silently weaken security.
- Priority: High

**Recurring expenses, installments, and annual projection:**
- What's not tested: Installment splitting, month carry-over, duplicate prevention, and forecast calculations.
- Files: `src/app/actions.ts`, `src/lib/annual-projection.ts`, `src/app/(private)/dashboard/anual/page.tsx`
- Risk: Financial totals and projections can drift without detection.
- Priority: High

**Core formatting and date handling:**
- What's not tested: `parseAmountToCents`, `formatDateInput`, month/year range helpers, and timezone-sensitive date parsing with `T12:00:00`.
- Files: `src/lib/format.ts`, `src/app/actions.ts`
- Risk: Amount parsing and date boundaries can break silently across locales or hosting environments.
- Priority: Medium

---

*Concerns audit: Thu Apr 23 2026*
