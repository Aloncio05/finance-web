# Desenvolvimento

## Scripts

| Comando | Finalidade |
| --- | --- |
| `bun run dev` | Inicia o Next.js em desenvolvimento. |
| `bun run build` | Executa build de producao do Next.js. |
| `bun run start` | Serve o build produzido. |
| `bun run lint` | Executa ESLint. |
| `bun run db:deploy` | Executa `prisma db push`. |
| `bun run vercel-build` | Executa `prisma db push`, `prisma generate` e `next build`. |

## Estrutura de codigo

| Caminho | Uso |
| --- | --- |
| `src/app/` | Rotas, layouts, paginas e Server Actions. |
| `src/app/(auth)/` | Login, cadastro, esqueci senha e reset de senha. |
| `src/app/(private)/` | Dashboard, categorias e transacoes protegidas por sessao. |
| `src/components/` | Componentes reutilizaveis de UI e graficos. |
| `src/lib/` | Autenticacao, Prisma, email, validadores e regras de dominio. |
| `prisma/` | Schema e migrations do banco. |
| `src/generated/prisma/` | Prisma Client gerado. |

## Padroes de implementacao

- Use Server Actions para mutacoes de formularios.
- Valide entradas no servidor com schemas de `src/lib/validators.ts`.
- Sempre escopar leituras e escritas pelo usuario autenticado (`session.user.id`).
- Use `revalidatePath` apos mutacoes que afetam dashboards, categorias ou transacoes.
- Use helpers puros em `src/lib/format.ts`, `src/lib/recommendations.ts` e `src/lib/annual-projection.ts` para regras reutilizaveis.
- Nao hardcode valores de ambiente, tokens ou strings de conexao.

## Banco de dados

O projeto usa Prisma 7 com provider PostgreSQL. O datasource e configurado em `prisma.config.ts`, usando `DIRECT_URL` quando existir e `DATABASE_URL` como fallback.

Fluxo comum de alteracao de schema:

1. Edite `prisma/schema.prisma`.
2. Aplique no banco local com `bunx prisma db push`.
3. Gere o client com `bunx prisma generate` se o postinstall nao tiver rodado.
4. Ajuste os imports de tipos gerados em `@/generated/prisma/client`.

## Email e reset de senha

`src/lib/email.ts` usa Resend. Em ambientes publicos, `EMAIL_FROM` nao deve usar dominio `resend.dev`; o codigo exige remetente de dominio verificado.

## Qualidade

Antes de entregar alteracoes, rode pelo menos:

```bash
bun run lint
bun run build
```

Se a alteracao tocar Prisma, rode tambem:

```bash
bunx prisma generate
```
