# External Integrations

**Analysis Date:** Tue May 05 2026

## APIs & External Services

**Email delivery:**
- Resend - password reset email delivery from `src/lib/email.ts` and invoked by `src/app/actions.ts`.
  - SDK/Client: `resend`
  - Auth: `RESEND_API_KEY`

**Hosting/platform:**
- Vercel - deployment/build target documented in `vercel.json`, `README.md`, and `DEPLOY_VERCEL.md`.
  - SDK/Client: Not applicable
  - Auth: Vercel project environment; app code checks `VERCEL` and `VERCEL_URL` in `src/lib/email.ts` and `src/app/actions.ts`

**Database connectivity:**
- Neon/Postgres adapter path - active Prisma adapter instantiated in `src/lib/prisma.ts`.
  - SDK/Client: `@prisma/adapter-neon` + generated Prisma client from `src/generated/prisma`
  - Auth: `DATABASE_URL`

## Data Storage

**Databases:**
- PostgreSQL via Prisma schema in `prisma/schema.prisma`.
  - Connection: `DATABASE_URL` in `src/lib/prisma.ts`
  - Direct/CLI connection: `DIRECT_URL` in `prisma.config.ts`
  - Client: Prisma generated client in `src/generated/prisma/client.ts`
- SQLite/libSQL are explicitly not supported by the active runtime, per `README.md`; the app expects a PostgreSQL-compatible database.

**File Storage:**
- Local filesystem only detected for source/assets in `src/app/favicon.ico`; no S3, Blob, Cloudinary, or upload SDK imports were found.

**Caching:**
- None detected as external infrastructure.
- Internal request memoization is used with React `cache` in `src/lib/auth.ts`.

## Authentication & Identity

**Auth Provider:**
- Custom - application-managed auth implemented in `src/lib/auth.ts` and `src/app/actions.ts`.
  - Implementation: bcrypt password hashes via `bcryptjs`, session rows in Prisma `Session` model (`prisma/schema.prisma`), and HTTP-only cookie `finance_session` in `src/lib/auth.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected - no Sentry, Datadog, LogRocket, or similar SDK imports/config files were found.

**Logs:**
- No centralized logging integration detected.

## CI/CD & Deployment

**Hosting:**
- Vercel, configured by `vercel.json` and described in `DEPLOY_VERCEL.md`.

**CI Pipeline:**
- None detected in repo - no `.github/workflows/`, Docker build files, or other CI config were found.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - required by `src/lib/prisma.ts`
- `DIRECT_URL` - required by `prisma.config.ts`
- `APP_URL` - required in public environments by `src/app/actions.ts`
- `EMAIL_FROM` - required by `src/lib/email.ts`
- `RESEND_API_KEY` - required by `src/lib/email.ts`

**Secrets location:**
- Example placeholders live in `.env.example` and `.env.production.example`.
- Production secrets are intended to be configured in Vercel project environment settings, per `DEPLOY_VERCEL.md`.

## Webhooks & Callbacks

**Incoming:**
- None detected - no `src/**/route.ts` files or webhook endpoints were found.

**Outgoing:**
- Resend API call from `src/lib/email.ts`.
- Browser redirect links for password reset use public app URLs composed in `src/app/actions.ts`.

---

*Integration audit: Tue May 05 2026*
