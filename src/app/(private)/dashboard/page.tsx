import Link from "next/link";

import { DashboardCategoryExplorer } from "@/components/dashboard-category-explorer";
import { formatCurrencyFromCents, formatDate, getMonthRange, getSingleParam } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getMonthlyPlan } from "@/lib/recommendations";
import { verifySession } from "@/lib/auth";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await verifySession();
  const params = await searchParams;
  const selectedCategory = getSingleParam(params.category);
  const month = getMonthRange(getSingleParam(params.month));

  const categories = await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      transactionDate: {
        gte: month.start,
        lt: month.end,
      },
    },
    include: {
      category: true,
    },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
  });

  type DashboardTransaction = (typeof transactions)[number];
  type ExpenseByCategory = { id: string; name: string; total: number; color: string };

  const totalIncome = transactions
    .filter((transaction: DashboardTransaction) => transaction.type === "INCOME")
    .reduce((sum: number, transaction: DashboardTransaction) => sum + transaction.amountCents, 0);
  const totalExpense = transactions
    .filter((transaction: DashboardTransaction) => transaction.type === "EXPENSE")
    .reduce((sum: number, transaction: DashboardTransaction) => sum + transaction.amountCents, 0);
  const balance = totalIncome - totalExpense;
  const monthlyPlan = getMonthlyPlan(totalIncome, totalExpense);
  const expensesByCategory = Object.values(
    transactions
      .filter((transaction: DashboardTransaction) => transaction.type === "EXPENSE")
      .reduce<Record<string, ExpenseByCategory>>((acc: Record<string, ExpenseByCategory>, transaction: DashboardTransaction) => {
        const current = acc[transaction.categoryId] ?? {
          id: transaction.categoryId,
          name: transaction.category.name,
          total: 0,
          color: transaction.category.color,
        };
        current.total += transaction.amountCents;
        acc[transaction.categoryId] = current;
        return acc;
      }, {}),
  ) as ExpenseByCategory[];

  expensesByCategory.sort((left, right) => right.total - left.total);

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#082f49_100%)] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Visão do período</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{month.label}</h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-300">
              Veja o pulso do seu dinheiro, identifique desequilíbrios rapidamente e ajuste sua rotina antes do fim do mês.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/transactions?type=EXPENSE" className="inline-flex rounded-full bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300">
                Lançar despesa
              </Link>
              <Link href="/transactions?type=INCOME" className="inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                Lançar receita
              </Link>
              <Link href="/dashboard/anual" className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">
                Ver visão anual
              </Link>
            </div>
          </div>

          <form className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[180px,1fr,auto]">
            <input
              type="month"
              name="month"
              defaultValue={month.value}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            />
            <select
              name="category"
              defaultValue={selectedCategory ?? ""}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category: (typeof categories)[number]) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Aplicar
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-emerald-100/80">Receitas</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(totalIncome)}</strong>
          </article>
          <article className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5">
            <p className="text-sm text-rose-100/80">Despesas</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(totalExpense)}</strong>
          </article>
          <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-100/80">Saldo</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(balance)}</strong>
          </article>
        </div>

        <article className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Como usar a sobra</p>
              <h3 className="text-2xl font-semibold text-white">{monthlyPlan.title}</h3>
              <p className="text-sm leading-7 text-slate-300">{monthlyPlan.description}</p>
            </div>
            <p className="max-w-sm text-xs leading-6 text-slate-400">
              Estas sugestões são educativas e usam regras gerais do seu orçamento mensal. Não constituem recomendação de investimento.
            </p>
          </div>

          {monthlyPlan.buckets.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {monthlyPlan.buckets.map((bucket) => (
                <article key={bucket.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-300">{bucket.label}</p>
                  <strong className={`mt-3 block text-2xl font-semibold ${bucket.accentClassName}`}>
                    {formatCurrencyFromCents(bucket.amountCents)}
                  </strong>
                </article>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <DashboardCategoryExplorer
        categories={expensesByCategory}
        initialCategoryId={selectedCategory}
        totalExpense={totalExpense}
        transactions={transactions.map((transaction: DashboardTransaction) => ({
          id: transaction.id,
          categoryId: transaction.categoryId,
          categoryName: transaction.category.name,
          description: transaction.description,
          amountCents: transaction.amountCents,
          dateLabel: formatDate(transaction.transactionDate),
          isIncome: transaction.type === "INCOME",
        }))}
      />
    </div>
  );
}
