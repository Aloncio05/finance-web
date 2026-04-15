import Link from "next/link";

import { carryRecurringExpensesAction, deleteTransactionAction, saveTransactionAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { RecurrenceType, TransactionType } from "@/generated/prisma/client";
import { verifySession } from "@/lib/auth";
import { formatCurrencyFromCents, formatDate, formatDateInput, getMonthRange, getSingleParam } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await verifySession();
  const params = await searchParams;
  const error = getSingleParam(params.error);
  const success = getSingleParam(params.success);
  const editId = getSingleParam(params.edit);
  const selectedCategory = getSingleParam(params.category);
  const month = getMonthRange(getSingleParam(params.month));

  const [categories, transactionToEdit, transactions] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    editId
      ? prisma.transaction.findFirst({
          where: {
            id: editId,
            userId: session.user.id,
          },
        })
      : Promise.resolve(null),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        transactionDate: {
          gte: month.start,
          lt: month.end,
        },
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const incomeCategories = categories.filter((category) => category.type === TransactionType.INCOME);
  const expenseCategories = categories.filter((category) => category.type === TransactionType.EXPENSE);

  return (
    <div className="grid gap-6 xl:grid-cols-[440px,1fr]">
      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Lançamentos</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {transactionToEdit ? "Editar transação" : "Nova transação"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Registre entradas e saídas com categoria, data, recorrência e observações para manter o painel sempre confiável.
          </p>
        </div>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <form action={saveTransactionAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" defaultValue={transactionToEdit?.id} />

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Descrição</span>
            <input
              name="description"
              required
              defaultValue={transactionToEdit?.description}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="Ex.: Mercado do mês"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Tipo</span>
              <select
                name="type"
                defaultValue={transactionToEdit?.type ?? TransactionType.EXPENSE}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value={TransactionType.EXPENSE}>Despesa</option>
                <option value={TransactionType.INCOME}>Receita</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Valor</span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={transactionToEdit ? transactionToEdit.amountCents / 100 : undefined}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                placeholder="0,00"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Categoria</span>
              <select
                name="categoryId"
                defaultValue={transactionToEdit?.categoryId}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <optgroup label="Despesas">
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Receitas">
                  {incomeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Data</span>
              <input
                name="transactionDate"
                type="date"
                required
                defaultValue={transactionToEdit ? formatDateInput(transactionToEdit.transactionDate) : formatDateInput(new Date())}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Recorrência mensal</span>
            <select
              name="recurrenceType"
              defaultValue={transactionToEdit?.recurrenceType ?? RecurrenceType.NONE}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
            >
              <option value={RecurrenceType.NONE}>Sem recorrência</option>
              <option value={RecurrenceType.FIXED}>Despesa fixa</option>
              <option value={RecurrenceType.VARIABLE}>Despesa variável</option>
            </select>
            <span className="text-xs leading-6 text-slate-400">
              Use apenas para despesas. Receitas sempre são salvas sem recorrência.
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Observações</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={transactionToEdit?.notes ?? undefined}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="Opcional"
            />
          </label>

          <SubmitButton className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
            {transactionToEdit ? "Atualizar transação" : "Salvar transação"}
          </SubmitButton>

          {transactionToEdit ? (
            <Link href="/transactions" className="block text-center text-sm font-medium text-slate-400 transition hover:text-white">
              Cancelar edição
            </Link>
          ) : null}
        </form>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Histórico do mês</h2>
            <p className="mt-2 text-sm text-slate-400">Filtre por mês e categoria para revisar ou corrigir seus lançamentos.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
            <form className="grid gap-3 sm:grid-cols-[180px,1fr,auto]">
              <input
                type="month"
                name="month"
                defaultValue={month.value}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              />
              <select
                name="category"
                defaultValue={selectedCategory ?? ""}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white">
                Filtrar
              </button>
            </form>

            <form action={carryRecurringExpensesAction}>
              <input type="hidden" name="month" value={month.value} />
              <button className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 lg:w-auto">
                Levar recorrentes para o próximo mês
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
          Despesas marcadas como <strong className="text-white">fixas</strong> ou <strong className="text-white">variáveis</strong> podem ser levadas para o mês seguinte sem duplicar se você repetir a ação.
        </div>

        <div className="mt-6 space-y-3">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === TransactionType.INCOME;
            const recurrenceLabel =
              transaction.recurrenceType === RecurrenceType.FIXED
                ? "Fixa"
                : transaction.recurrenceType === RecurrenceType.VARIABLE
                  ? "Variável"
                  : null;

            return (
              <article key={transaction.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-white">{transaction.description}</h3>
                      <span
                        className={isIncome ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200" : "rounded-full bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200"}
                      >
                        {isIncome ? "Receita" : "Despesa"}
                      </span>
                      {recurrenceLabel ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                          {recurrenceLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {transaction.category.name} · {formatDate(transaction.transactionDate)}
                    </p>
                    {transaction.carriedFromId ? (
                      <p className="mt-2 text-xs text-cyan-200">Gerada a partir de uma recorrência do mês anterior.</p>
                    ) : null}
                    {transaction.notes ? <p className="mt-3 text-sm text-slate-300">{transaction.notes}</p> : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <strong className={isIncome ? "text-xl font-semibold text-emerald-300" : "text-xl font-semibold text-rose-300"}>
                      {isIncome ? "+" : "-"}
                      {formatCurrencyFromCents(transaction.amountCents)}
                    </strong>
                    <div className="flex gap-2">
                      <Link href={`/transactions?edit=${transaction.id}`} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/20">
                        Editar
                      </Link>
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={transaction.id} />
                        <button className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {transactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
              Nenhuma transação encontrada para os filtros atuais.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
