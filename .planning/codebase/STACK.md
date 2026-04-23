# Technology Stack

**Analysis Date:** Thu Apr 23 2026

## Languages

**Primary:**
- TypeScript 5.x - application code in `src/app/*.tsx`, `src/lib/*.ts`, `src/components/*.tsx`, and `prisma.config.ts`.

**Secondary:**
- CSS - global styling in `src/app/globals.css`.
- Prisma schema DSL - data model definition in `prisma/schema.prisma`.
- Windows CMD scripting - local startup helpers in `start-dev.cmd` and `abrir-finance-flow.cmd`.

## Runtime

**Environment:**
- Node.js runtime for app, build, and Prisma CLI usage via `package.json` scripts (`next dev`, `next build`, `next start`, `prisma generate`, `prisma migrate deploy`).
- Version pin: Not detected in repo root (`.nvmrc` not present).

**Package Manager:**
- npm - evidenced by `package-lock.json`, `package.json`, `README.md`, `start-dev.cmd`, and `vercel.json`.
- Lockfile: present in `package-lock.json`.

## Frameworks

**Core:**
- Next.js 16.2.3 - full-stack React app framework used by `src/app/layout.tsx`, `src/app/page.tsx`, and server actions in `src/app/actions.ts`.
- React 19.2.4 - UI runtime used across `src/app/**/*.tsx` and `src/components/*.tsx`.
- Prisma 7.7.0 - ORM/client generation defined in `prisma/schema.prisma`, `prisma.config.ts`, and consumed via `src/lib/prisma.ts`.

**Testing:**
- Not detected - no Jest/Vitest/Playwright config or test files were found in the repo root or `src/`.

**Build/Dev:**
- Turbopack - enabled in `next.config.ts` for Next.js development/build tooling.
- Tailwind CSS 4 - styling pipeline enabled by `src/app/globals.css` and `postcss.config.mjs`.
- PostCSS - configured in `postcss.config.mjs`.
- ESLint 9 + `eslint-config-next` - linting configured in `eslint.config.mjs`.
- TypeScript compiler - configured in `tsconfig.json` with strict mode and `@/*` path alias.

## Key Dependencies

**Critical:**
- `next` 16.2.3 - application runtime and routing in `package.json`.
- `react` 19.2.4 / `react-dom` 19.2.4 - UI rendering in `package.json`.
- `@prisma/client` 7.7.0 - generated database client used from `src/generated/prisma` and `src/lib/prisma.ts`.
- `prisma` 7.7.0 - schema generation and migration tooling used by `postinstall`, `db:deploy`, and `vercel-build` in `package.json`.
- `zod` 4.3.6 - input validation in `src/lib/validators.ts`.
- `bcryptjs` 3.0.3 - password hashing and comparison in `src/app/actions.ts`.

**Infrastructure:**
- `@prisma/adapter-neon` 7.7.0 - active database adapter instantiated in `src/lib/prisma.ts`.
- `resend` 4.7.0 - transactional email delivery in `src/lib/email.ts`.
- `recharts` 3.8.1 - client-side chart rendering in `src/components/category-chart.tsx` and `src/components/annual-projection-chart.tsx`.
- `@tailwindcss/postcss` 4.x - CSS build integration in `postcss.config.mjs`.

## Configuration

**Environment:**
- Environment variables are read from process env in `src/lib/prisma.ts`, `src/lib/email.ts`, `src/app/actions.ts`, and `prisma.config.ts`.
- Example env files are present as `.env.example` and `.env.production.example`.
- Key config names detected: `APP_URL`, `DATABASE_URL`, `DIRECT_URL`, `EMAIL_FROM`, `RESEND_API_KEY`, `TURSO_AUTH_TOKEN`.

**Build:**
- App build/dev config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`.
- Prisma config: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/*`.
- Deployment build override: `vercel.json` using `npm run vercel-build`.

## Platform Requirements

**Development:**
- Node.js + npm are required to run `package.json` scripts and local startup helpers in `start-dev.cmd`.
- A configured database URL is required before `src/lib/prisma.ts` can initialize Prisma.
- Local workflow expects a `.env` created from `.env.example`, as documented in `README.md` and enforced in `start-dev.cmd`.
- Windows-specific helper scripts exist in `start-dev.cmd` and `abrir-finance-flow.cmd`.

**Production:**
- Deployment target is Vercel, indicated by `vercel.json`, `package.json` (`vercel-build`), `README.md`, and `DEPLOY_VERCEL.md`.
- Public environment also requires email configuration for password reset flow in `src/lib/email.ts` and `src/app/actions.ts`.
- Stack evidence is mixed for database hosting: `src/lib/prisma.ts` uses Neon/Postgres, while `README.md`, `.env*.example`, and `DEPLOY_VERCEL.md` document Turso/libSQL variables and Vercel deployment.

---

*Stack analysis: Thu Apr 23 2026*
