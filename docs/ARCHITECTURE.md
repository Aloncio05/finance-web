# Arquitetura

## Visao geral

`finance-web` e um monolito Next.js App Router para controle financeiro pessoal. A aplicacao usa renderizacao server-side, Server Actions para mutacoes, autenticacao por cookie de sessao e persistencia PostgreSQL via Prisma.

## Camadas principais

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Rotas e layouts | `src/app/` | Define URLs, shells publico/privado e paginas renderizadas pelo App Router. |
| Mutacoes | `src/app/actions.ts` | Centraliza login, cadastro, reset de senha, categorias, transacoes e recorrencias. |
| Sessao | `src/lib/auth.ts` | Le e valida cookie `finance_session`, cria/destroi sessoes e protege rotas privadas. |
| Banco | `src/lib/prisma.ts`, `prisma/schema.prisma` | Configura Prisma com PostgreSQL e define os modelos persistidos. |
| Dominio | `src/lib/*.ts` | Formata valores/datas, valida entradas, calcula recomendacoes e projecao anual. |
| Componentes | `src/components/` | Renderiza botoes e graficos reutilizaveis. |

## Fluxo de autenticacao

1. `src/app/page.tsx` decide entre `/dashboard` e `/login` usando `getOptionalSession`.
2. Paginas em `src/app/(auth)/` enviam formularios para Server Actions.
3. `registerAction` e `loginAction` validam entrada com Zod, consultam o Prisma e criam uma sessao.
4. `src/app/(private)/layout.tsx` chama `verifySession` para bloquear usuarios nao autenticados.
5. `logoutAction` remove o registro de sessao e o cookie.

## Fluxo financeiro

1. Paginas privadas carregam dados do usuario diretamente por Prisma.
2. Formularios chamam `saveCategoryAction`, `saveTransactionAction`, `deleteCategoryAction`, `deleteTransactionAction` ou `carryRecurringTransactionsAction`.
3. As actions validam entradas no servidor, aplicam escopo por `session.user.id`, persistem alteracoes e chamam `revalidatePath`.
4. Dashboards calculam totais de receitas, despesas, saldo, categorias e projecoes a partir dos dados persistidos.

## Modelo de dados

O schema Prisma define:

| Modelo | Uso |
| --- | --- |
| `User` | Conta do usuario e relacoes com sessoes, categorias e transacoes. |
| `Session` | Token de sessao com expiracao. |
| `PasswordResetToken` | Token hashado para reset de senha. |
| `Category` | Categoria por usuario, nome, tipo e cor. |
| `Transaction` | Lancamento financeiro, recorrencia, parcelas e vinculos de copia. |

Os enums `TransactionType` e `RecurrenceType` controlam tipo financeiro e recorrencia.

## Decisoes relevantes

- Nao ha camada repository/service: paginas e actions usam Prisma diretamente.
- Todas as mutacoes ficam em um unico arquivo server-only (`src/app/actions.ts`).
- A sessao e armazenada no banco e referenciada por token hashado no cookie.
- Validacao de negocio acontece no servidor com Zod antes das escritas.
- O Prisma Client e gerado em `src/generated/prisma`.
