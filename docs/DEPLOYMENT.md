# Deploy

## Alvo suportado

O repositorio contem `vercel.json` com `buildCommand` apontando para:

```bash
npm run vercel-build
```

O script `vercel-build` em `package.json` executa:

```bash
prisma db push && prisma generate && next build
```

Em desenvolvimento local, prefira `bun run ...`. Na Vercel, o comando configurado no arquivo do projeto e o que sera usado pelo painel.

## Pre-requisitos

- Projeto importado na Vercel.
- Banco PostgreSQL disponivel.
- Variaveis `DATABASE_URL`, `DIRECT_URL`, `APP_URL`, `RESEND_API_KEY` e `EMAIL_FROM` configuradas no painel.
- Remetente `EMAIL_FROM` com dominio verificado para ambientes publicos.

## Variaveis na Vercel

Configure os nomes abaixo sem expor valores reais:

```dotenv
DATABASE_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
DIRECT_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
APP_URL="https://example.com"
RESEND_API_KEY="[REMOVIDO_POR_SEGURANCA]"
EMAIL_FROM="Finance Web <no-reply@example.com>"
```

`DATABASE_URL` alimenta o runtime. `DIRECT_URL` alimenta comandos Prisma via `prisma.config.ts` quando disponivel.

## Pipeline de build

1. A Vercel executa o comando configurado em `vercel.json`.
2. `prisma db push` sincroniza o schema no banco configurado.
3. `prisma generate` atualiza o client gerado.
4. `next build` compila a aplicacao.

## Validacao pos-deploy

Depois da primeira publicacao, valide:

1. Criacao de conta.
2. Login e logout.
3. Dashboard privado.
4. Cadastro de categoria.
5. Cadastro de transacao.
6. Recorrencia para proximo mes.
7. Fluxo de esqueci senha com email real configurado.
8. Acesso mobile ao link publico.

## Cuidados

- `APP_URL` deve ser a origem publica final usada pelos usuarios.
- O cookie de sessao usa `secure` automaticamente quando `NODE_ENV=production`.
- Nao usar SQLite/libSQL no deploy; o schema atual e PostgreSQL.
- Trate `prisma db push` em producao com cuidado, pois ele altera o schema do banco alvo.
