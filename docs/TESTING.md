# Testes

## Estado atual

Nao ha framework de testes configurado neste repositorio. Nao foram detectados arquivos `*.test.*`, `*.spec.*`, `vitest.config.*`, `jest.config.*`, Playwright ou Cypress.

A qualidade automatizada atual depende de:

```bash
bun run lint
bun run build
```

## O que validar manualmente

Para mudancas funcionais, execute um smoke test no navegador:

1. Criar conta em `/register`.
2. Fazer login em `/login`.
3. Criar, editar e remover uma categoria em `/categories`.
4. Criar, editar e remover uma transacao em `/transactions`.
5. Testar despesa recorrente com `Levar recorrentes para o proximo mes`.
6. Conferir cards e graficos em `/dashboard`.
7. Conferir projecao em `/dashboard/anual`.
8. Testar esqueci senha quando as variaveis de email estiverem configuradas.

## Alvos prioritarios para testes futuros

| Area | Motivo |
| --- | --- |
| `src/lib/validators.ts` | Contratos de entrada para auth, categorias e transacoes. |
| `src/lib/format.ts` | Conversao de valores monetarios e datas. |
| `src/lib/recommendations.ts` | Regras educativas de recomendacao mensal. |
| `src/lib/annual-projection.ts` | Logica de projecao anual. |
| `src/app/actions.ts` | Fluxos criticos de autenticacao, CRUD, parcelas e recorrencias. |
| `src/lib/auth.ts` | Cookie, sessao e bloqueio de rotas privadas. |

## Recomendacao de abordagem

Quando um runner for adicionado, priorize testes unitarios para helpers puros e testes de integracao para Server Actions.

Mocks devem ficar restritos a fronteiras externas:

- Prisma em `src/lib/prisma.ts`.
- `next/navigation` para redirects.
- `next/headers` para cookies.
- Resend em `src/lib/email.ts`.

Evite mockar os schemas Zod e helpers puros; use entradas reais e pequenas factories locais.

## Cobertura

Nao ha meta de cobertura configurada. Enquanto isso, considere `bun run build` e `bun run lint` como gates minimos, mas nao equivalentes a testes automatizados.
