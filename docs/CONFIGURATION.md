# Configuracao

## Variaveis de ambiente

As chaves esperadas estao em `.env.example`:

| Variavel | Obrigatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Conexao PostgreSQL usada em runtime pelo Prisma. |
| `DIRECT_URL` | Recomendado | Conexao direta usada pelo Prisma CLI em `prisma.config.ts`. |
| `APP_URL` | Sim para ambientes publicos | Origem publica usada para links de reset de senha. |
| `RESEND_API_KEY` | Sim para envio de email | Credencial da Resend usada em `src/lib/email.ts`. |
| `EMAIL_FROM` | Sim para envio de email | Remetente dos emails de reset. |

Exemplo seguro:

```dotenv
DATABASE_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
DIRECT_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
APP_URL="https://example.com"
RESEND_API_KEY="[REMOVIDO_POR_SEGURANCA]"
EMAIL_FROM="Finance Web <no-reply@example.com>"
```

## Banco

`prisma/schema.prisma` define provider `postgresql`. `prisma.config.ts` resolve a URL do datasource com esta prioridade:

1. `DIRECT_URL`
2. `DATABASE_URL`

Use `DIRECT_URL` para comandos Prisma quando o provedor oferecer uma conexao direta separada da conexao pooled/runtime.

## Prisma Client

O client e gerado em `src/generated/prisma` por esta configuracao:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

Imports da aplicacao usam `@/generated/prisma/client`.

## Email

`src/lib/email.ts` exige `RESEND_API_KEY` e `EMAIL_FROM`. Em runtime publico (`NODE_ENV=production`, `VERCEL` ou `VERCEL_URL`), `EMAIL_FROM` nao pode usar dominio `resend.dev`.

## URL publica

`src/app/actions.ts` usa `APP_URL` ou `NEXT_PUBLIC_APP_URL` para montar links de reset de senha. Em producao ou na Vercel, a ausencia dessas variaveis gera erro intencional para evitar links incorretos.

## Seguranca de configuracao

- Nunca commitar `.env` com valores reais.
- Nunca colar credenciais reais em documentacao, logs ou exemplos.
- Use `.env.example` apenas como lista de chaves e exemplos neutros.
- Mascarar strings de banco, tokens e chaves em qualquer saida compartilhada.
