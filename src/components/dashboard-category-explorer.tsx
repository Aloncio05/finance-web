'use client';

import Link from "next/link";
import { useState } from "react";

import { CategoryChart } from "@/components/category-chart";

type ExpenseByCategory = {
  id: string;
  name: string;
  total: number;
  color: string;
};

type DashboardTransaction = {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amountCents: number;
  dateLabel: string;
  isIncome: boolean;
};

type DashboardCategoryExplorerProps = {
  categories: ExpenseByCategory[];
  transactions: DashboardTransaction[];
  totalExpense: number;
  initialCategoryId?: string;
};

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatCurrencyFromCents(value: number) {
  return currencyFormatter.format(value / 100);
}

const detailColors = ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#34d399", "#60a5fa", "#f472b6"];

export function DashboardCategoryExplorer({
  categories,
  transactions,
  totalExpense,
  initialCategoryId,
}: DashboardCategoryExplorerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId ?? "");
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const visibleTransactions = selectedCategory
    ? transactions.filter((transaction) => transaction.categoryId === selectedCategory.id && !transaction.isIncome)
    : transactions.slice(0, 6);
  const chartData = selectedCategory
    ? visibleTransactions.map((transaction, index) => ({
        id: transaction.id,
        name: `${transaction.description} · ${transaction.dateLabel}`,
        total: transaction.amountCents,
        color: detailColors[index % detailColors.length] ?? selectedCategory.color,
      }))
    : categories;

  function selectCategory(categoryId: string) {
    setSelectedCategoryId((currentCategoryId) => currentCategoryId === categoryId ? "" : categoryId);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Despesas por categoria</h3>
            <p className="mt-1 text-sm text-slate-400">
              {selectedCategory
                ? `Drill down em ${selectedCategory.name}: o gráfico agora mostra os lançamentos dessa categoria.`
                : "Resumo por categoria. Clique em uma fatia ou categoria para descer ao detalhe."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">Resumo</span>
              {selectedCategory ? (
                <>
                  <span>/</span>
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                    {selectedCategory.name}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          {selectedCategory ? (
            <button
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              onClick={() => setSelectedCategoryId("")}
              type="button"
            >
              Ver todas
            </button>
          ) : (
            <Link href="/transactions" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
              Ver transações
            </Link>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr,280px] xl:items-center">
          <CategoryChart
            data={chartData}
            onSelectCategory={selectedCategory ? undefined : selectCategory}
            selectedCategoryId={selectedCategory ? null : selectedCategoryId || null}
          />

          <ul className="space-y-3">
            {categories.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                Nenhuma despesa encontrada neste período.
              </li>
            ) : (
              categories.map((item) => {
                const percentage = totalExpense > 0 ? item.total / totalExpense : 0;
                const isSelected = selectedCategoryId === item.id;

                return (
                  <li key={item.id}>
                    <button
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-cyan-300/50 bg-cyan-400/15"
                          : "border-white/10 bg-white/5 hover:border-cyan-300/40 hover:bg-cyan-400/10"
                      }`}
                      onClick={() => selectCategory(item.id)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-slate-200">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <strong className="block text-sm font-semibold text-white">{formatCurrencyFromCents(item.total)}</strong>
                        <span className="text-xs font-medium text-slate-400">{percentageFormatter.format(percentage)} dos gastos</span>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Movimentações recentes</h3>
            <p className="mt-1 text-sm text-slate-400">
              {selectedCategory
                ? `Despesas de ${selectedCategory.name} neste mês.`
                : "Últimos lançamentos filtrados pelo mês atual."}
            </p>
          </div>
          <Link href="/transactions" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
            Novo lançamento
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {visibleTransactions.map((transaction) => (
            <article key={transaction.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{transaction.description}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {transaction.categoryName} · {transaction.dateLabel}
                  </p>
                </div>
                <strong className={transaction.isIncome ? "text-emerald-300" : "text-rose-300"}>
                  {transaction.isIncome ? "+" : "-"}
                  {formatCurrencyFromCents(transaction.amountCents)}
                </strong>
              </div>
            </article>
          ))}

          {visibleTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              Nenhuma movimentação encontrada para esta seleção.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
