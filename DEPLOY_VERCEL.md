## Publicar com link da Vercel

Este projeto ja esta preparado para deploy com:

- `@prisma/adapter-libsql`
- `@libsql/client`
- comando de build `npm run vercel-build`
- `vercel.json` apontando para esse build

## 1. Criar o banco no Turso

No painel do Turso:

1. crie um banco novo
2. copie a URL `libsql://...`
3. gere um token de acesso

Variaveis que voce vai usar depois na Vercel:

- `DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 2. Subir o projeto na Vercel pelo painel

Como a CLI esta bloqueada neste ambiente corporativo por certificado da rede, use o painel web:

1. envie o projeto para um repositorio Git
2. acesse a Vercel e clique em **Add New Project**
3. importe o repositorio do `finance-web`
4. mantenha o framework como `Next.js`

## 3. Configurar as variaveis de ambiente

No projeto da Vercel, adicione:

- `DATABASE_URL=libsql://SEU-BANCO.turso.io`
- `TURSO_AUTH_TOKEN=[REMOVIDO_POR_SEGURANCA]`

## 4. Confirmar o comando de build

Este projeto ja inclui:

- `vercel.json` com `npm run vercel-build`
- script `vercel-build` no `package.json`

Se o painel pedir override manual, use:

`npm run vercel-build`

## 5. Fazer o primeiro deploy

Ao publicar:

1. a Vercel executa `prisma migrate deploy`
2. depois roda `next build`
3. gera a URL publica `*.vercel.app`

## 6. Validacao depois do deploy

Teste no link publico:

1. criar conta
2. entrar no dashboard
3. cadastrar uma transacao
4. levar recorrentes para o proximo mes
5. abrir no celular

## Observacoes

- localmente, continue usando `.env` com `DATABASE_URL="file:./dev.db"`
- em producao, use banco hospedado; `SQLite` local nao e adequado para um link publico na Vercel
- o app usa cookie seguro em producao automaticamente
