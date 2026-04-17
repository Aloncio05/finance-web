import Link from "next/link";

import { AnnualProjectionChart, type AnnualChartType } from "@/components/annual-projection-chart";
import { RecurrenceType, TransactionType } from "@/generated/prisma/client";
import { buildAnnualProjection } from "@/lib/annual-projection";
import { formatCurrencyFromCents, getSingleParam, getYearRange } from "@/lib/format";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AnnualDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CHART_TYPE_OPTIONS: Array<{ value: AnnualChartType; label: string }> = [
  { value: "grouped-bar", label: "Barras agrupadas" },
  { value: "line", label: "Linha" },
  { value: "area", label: "Área" },
  { value: "stacked-bar", label: "Barras empilhadas" },
  { value: "combo", label: "Combinado" },
];

function getChartType(value: string | undefined): AnnualChartType {
  return CHART_TYPE_OPTIONS.some((option) => option.value === value) ? (value as AnnualChartType) : "grouped-bar";
}

export default async function AnnualDashboardPage({ searchParams }: AnnualDashboardPageProps) {
  const session = await verifySession();
  const params = await searchParams;
  const selectedCategory = getSingleParam(params.category);
  const year = getYearRange(getSingleParam(params.year));
  const chartType = getChartType(getSingleParam(params.chartType));

  const [categories, yearTransactions, recurringExpenseHistory] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        transactionDate: {
          gte: year.start,
          lt: year.end,
        },
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      },
      orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        categoryId: true,
        type: true,
        amountCents: true,
        transactionDate: true,
        recurrenceType: true,
        carriedFromId: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: TransactionType.EXPENSE,
        recurrenceType: {
          not: RecurrenceType.NONE,
        },
        transactionDate: {
          lt: year.end,
        },
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      },
      orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        categoryId: true,
        type: true,
        amountCents: true,
        transactionDate: true,
        recurrenceType: true,
        carriedFromId: true,
      },
    }),
  ]);

  const projection = buildAnnualProjection(year.year, yearTransactions, recurringExpenseHistory);
  const monthsWithProjection = projection.months.filter((month) => month.projectedExpenseCents > 0).length;
  const selectedCategoryName = categories.find((category: (typeof categories)[number]) => category.id === selectedCategory)?.name;
  const selectedChartType = CHART_TYPE_OPTIONS.find((option) => option.value === chartType)?.label ?? "Barras agrupadas";

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#111827_0%,#0f172a_45%,#082f49_100%)] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Visão anual</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">{year.label}</h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Veja o gasto do ano inteiro mês a mês. Os meses futuros usam as despesas recorrentes já cadastradas para antecipar o que tende a acontecer.
            </p>
          </div>

          <form className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[140px,1fr,180px,auto]">
            <input
              type="number"
              name="year"
              min="2020"
              max="2100"
              defaultValue={year.value}
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
            <select
              name="chartType"
              defaultValue={chartType}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300"
            >
              {CHART_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Atualizar visão
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5">
            <p className="text-sm text-rose-100/80">Despesas realizadas</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(projection.totalActualExpenseCents)}</strong>
          </article>
          <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <p className="text-sm text-cyan-100/80">Despesas projetadas</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(projection.totalProjectedExpenseCents)}</strong>
          </article>
          <article className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-amber-100/80">Gasto total do ano</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{formatCurrencyFromCents(projection.totalExpenseCents)}</strong>
          </article>
          <article className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5">
            <p className="text-sm text-violet-100/80">Meses com projeção</p>
            <strong className="mt-3 block text-3xl font-semibold text-white">{monthsWithProjection}</strong>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Categoria: {selectedCategoryName ?? "Todas"}
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-100">
            Projetado = despesas recorrentes ainda não lançadas no mês
          </span>
          <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-cyan-400/40 hover:text-cyan-200">
            Voltar ao dashboard mensal
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Gasto do ano mês a mês</h3>
              <p className="mt-1 text-sm text-slate-400">Comparativo entre o que já aconteceu e o que tende a entrar pelos recorrentes.</p>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              {selectedChartType}
            </span>
          </div>

          <div className="mt-6">
            <AnnualProjectionChart data={projection.months} chartType={chartType} />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Leitura rápida</h3>
            <p className="mt-1 text-sm text-slate-400">Acompanhe o peso acumulado das despesas e encontre os meses mais sensíveis do ano.</p>
          </div>

          <div className="mt-6 space-y-3">
            {projection.months.map((month) => (
              <article key={month.monthLabel} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-white">{month.monthLabel}</h4>
                      {month.projectedExpenseCents > 0 ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                          Projetado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Realizado: {formatCurrencyFromCents(month.actualExpenseCents)}
                      {month.projectedExpenseCents > 0 ? ` · Projetado: ${formatCurrencyFromCents(month.projectedExpenseCents)}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">Acumulado do ano: {formatCurrencyFromCents(month.cumulativeExpenseCents)}</p>
                  </div>
                  <strong className="text-lg font-semibold text-white">{formatCurrencyFromCents(month.totalExpenseCents)}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Tabela detalhada</h3>
            <p className="mt-1 text-sm text-slate-400">Receitas reais, despesas realizadas, projeção restante e saldo de cada mês.</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-medium">Mês</th>
                <th className="px-4 py-3 font-medium">Receitas</th>
                <th className="px-4 py-3 font-medium">Despesas reais</th>
                <th className="px-4 py-3 font-medium">Despesas projetadas</th>
                <th className="px-4 py-3 font-medium">Saldo do mês</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projection.months.map((month) => (
                <tr key={month.monthLabel} className="border-b border-white/5 last:border-b-0">
                  <td className="px-4 py-4 font-medium text-white">{month.monthLabel}</td>
                  <td className="px-4 py-4">{formatCurrencyFromCents(month.actualIncomeCents)}</td>
                  <td className="px-4 py-4">{formatCurrencyFromCents(month.actualExpenseCents)}</td>
                  <td className="px-4 py-4">{formatCurrencyFromCents(month.projectedExpenseCents)}</td>
                  <td className={`px-4 py-4 font-semibold ${month.balanceCents >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatCurrencyFromCents(month.balanceCents)}
                  </td>
                  <td className="px-4 py-4">
                    {month.projectedExpenseCents > 0 ? (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                        Projetado
                      </span>
                    ) : month.isFutureMonth ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Sem projeção
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        Realizado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
