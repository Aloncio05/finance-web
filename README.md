## Iniciar no Window

1. Crie o arquivo `.env` a partir do `.env.example`.
2. Instale as dependencias com `npm.cmd install`.
3. Execute `abrir-finance-flow.cmd` na raiz do projeto.

Esse arquivo abre o navegador automaticamente, aplica a migracao no banco configurado com Prisma e sobe o app em modo desenvolvimento na porta `3050`.

Se preferir iniciar manualmente sem abrir o navegador, use `start-dev.cmd`.

## O que o app mostra

- receitas do mês
- despesas do mês
- saldo do mês
- sugestão educativa de como dividir a sobra entre reserva, investir e lazer
- despesas recorrentes fixas e variáveis que podem ser levadas para o próximo mês

URL local esperada: `http://127.0.0.1:3050`

## Despesas recorrentes

- marque uma despesa como `Despesa fixa` ou `Despesa variável` na tela de `Transações`
- use o botão `Levar recorrentes para o próximo mês`
- o app cria os lançamentos no mês seguinte sem duplicar se você repetir a ação

## Link fixo para acessar

Para publicar o app com um link fixo acessivel por celular e navegador:

1. crie um banco no `Turso`
2. configure em producao:
   `DATABASE_URL="libsql://SEU-BANCO.turso.io"`
   `TURSO_AUTH_TOKEN="[REMOVIDO_POR_SEGURANCA]"`
3. publique na `Vercel` usando o comando de build `npm run vercel-build`

Observacao:

- localmente, o app continua funcionando com `DATABASE_URL="file:./dev.db"`
- na Vercel, use um banco hospedado via `libSQL/Turso`; `SQLite` local nao e adequado para producao publica
- o roteiro completo de publicacao via painel esta em `DEPLOY_VERCEL.md`
