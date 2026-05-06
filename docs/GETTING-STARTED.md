# Primeiros passos

## Requisitos

- Bun para instalar dependencias e executar scripts locais.
- Node.js compativel com Next.js 16.
- Banco PostgreSQL acessivel pelo Prisma.
- Variaveis de ambiente configuradas a partir de `.env.example`.

## Configuracao inicial

1. Instale as dependencias:

```bash
bun install
```

2. Crie um arquivo `.env` local baseado em `.env.example`.

3. Configure as variaveis obrigatorias sem commitar valores reais:

```dotenv
DATABASE_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
DIRECT_URL="postgresql://[REMOVIDO_POR_SEGURANCA]@HOST:5432/DB?sslmode=require"
APP_URL="http://127.0.0.1:3050"
RESEND_API_KEY="[REMOVIDO_POR_SEGURANCA]"
EMAIL_FROM="Finance Web <no-reply@example.com>"
```

4. Sincronize o schema no banco de desenvolvimento:

```bash
bunx prisma db push
```

5. Gere o Prisma Client se necessario:

```bash
bunx prisma generate
```

## Rodar localmente

Execute o servidor Next.js:

```bash
bun run dev
```

Por padrao o script `dev` usa a porta escolhida pelo Next.js. Se o fluxo local do projeto exigir a porta `3050`, use o comando direto do Next.js com porta explicita:

```bash
bunx next dev -p 3050
```

A URL local esperada para os fluxos documentados e `http://127.0.0.1:3050`.

## Primeiro uso

1. Acesse `/register` e crie uma conta.
2. Entre no dashboard.
3. Crie categorias em `/categories`.
4. Cadastre receitas e despesas em `/transactions`.
5. Use o dashboard mensal e anual para acompanhar saldo e projecoes.

## Observacoes

- Nao use SQLite/libSQL neste projeto; o provider Prisma atual e `postgresql`.
- O reset de senha depende de `RESEND_API_KEY`, `EMAIL_FROM` e `APP_URL`.
- Nunca salve valores reais de `.env` no repositorio.
