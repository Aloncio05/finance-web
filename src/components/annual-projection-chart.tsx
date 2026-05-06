'use client';

import { useState } from "react";

export type AnnualChartType = "grouped-bar" | "line" | "area" | "stacked-bar" | "combo";

type AnnualProjectionMonth = {
  monthIndex: number;
  monthLabel: string;
  actualExpenseCents: number;
  projectedExpenseCents: number;
  totalExpenseCents: number;
  balanceCents: number;
};

type AnnualProjectionTransaction = {
  id: string;
  monthIndex: number;
  description: string;
  categoryName: string;
  amountCents: number;
  dateLabel: string;
  type: "INCOME" | "EXPENSE";
};

type AnnualProjectionChartProps = {
  data: AnnualProjectionMonth[];
  chartType: AnnualChartType;
  transactions: AnnualProjectionTransaction[];
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING_X = 32;
const PADDING_Y = 24;
const BAR_GAP = 6;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function formatCurrencyFromCents(value: number) {
  return currencyFormatter.format(value / 100);
}

export function AnnualProjectionChart({ data, chartType, transactions }: AnnualProjectionChartProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const selectedMonth = data.find((month) => month.monthIndex === selectedMonthIndex) ?? null;
  const selectedMonthExpenses = selectedMonth
    ? transactions.filter((transaction) => transaction.monthIndex === selectedMonth.monthIndex && transaction.type === "EXPENSE")
    : [];
  const highestValue = data.reduce((max, month) => Math.max(max, month.totalExpenseCents), 0);

  if (highestValue === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
        Cadastre despesas ou marque recorrências para acompanhar a visão anual.
      </div>
    );
  }

  if (selectedMonth) {
    const detailItems = [
      { label: "Realizado", value: selectedMonth.actualExpenseCents, color: "#fb923c" },
      { label: "Projetado", value: selectedMonth.projectedExpenseCents, color: "#22d3ee" },
    ];
    const detailHighestValue = Math.max(...detailItems.map((item) => item.value), 1);

    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">Ano</span>
              <span>/</span>
              <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                {selectedMonth.monthLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Drill down do mês: realizado contra projetado.</p>
          </div>
          <button
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
            onClick={() => setSelectedMonthIndex(null)}
            type="button"
          >
            Voltar ao ano
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {detailItems.map((item) => {
            const width = `${Math.max((item.value / detailHighestValue) * 100, item.value > 0 ? 8 : 0)}%`;

            return (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <strong className="text-lg font-semibold text-white">{formatCurrencyFromCents(item.value)}</strong>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full" style={{ backgroundColor: item.color, width }} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Total do mês: <strong className="text-white">{formatCurrencyFromCents(selectedMonth.totalExpenseCents)}</strong>
        </div>

        <div className={`mt-4 rounded-2xl border p-4 text-sm ${
          selectedMonth.balanceCents >= 0
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
            : "border-rose-400/20 bg-rose-400/10 text-rose-100"
        }`}
        >
          Saldo do mês: <strong>{formatCurrencyFromCents(selectedMonth.balanceCents)}</strong>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">Gastos do mês</h4>
              <p className="mt-1 text-xs text-slate-400">Cada despesa lançada em {selectedMonth.monthLabel}.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
              {selectedMonthExpenses.length} item(ns)
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {selectedMonthExpenses.length > 0 ? (
              selectedMonthExpenses.map((transaction) => (
                <article key={transaction.id} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.categoryName} · {transaction.dateLabel}
                      </p>
                    </div>
                    <strong className="text-sm font-semibold text-rose-300">
                      -{formatCurrencyFromCents(transaction.amountCents)}
                    </strong>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                Nenhum gasto lançado neste mês.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const chartInnerWidth = CHART_WIDTH - PADDING_X * 2;
  const chartInnerHeight = CHART_HEIGHT - PADDING_Y * 2;
  const groupWidth = chartInnerWidth / data.length;
  const gridValues = Array.from({ length: 4 }, (_, index) => Math.round((highestValue / 4) * (4 - index)));
  const linePoints = data.map((month, index) => {
    const x = PADDING_X + groupWidth * index + groupWidth / 2;
    const actualY = PADDING_Y + chartInnerHeight - (month.actualExpenseCents / highestValue) * chartInnerHeight;
    const projectedY = PADDING_Y + chartInnerHeight - (month.projectedExpenseCents / highestValue) * chartInnerHeight;
    const totalY = PADDING_Y + chartInnerHeight - (month.totalExpenseCents / highestValue) * chartInnerHeight;

    return {
      month,
      x,
      actualY,
      projectedY,
      totalY,
    };
  });

  const barWidth = Math.min(16, Math.max(8, (groupWidth - BAR_GAP * 4) / 3));
  const groupBarWidth = barWidth * 3 + BAR_GAP * 2;

  const bars = data.map((month, index) => {
    const groupX = PADDING_X + groupWidth * index + (groupWidth - groupBarWidth) / 2;
    const actualHeight = (month.actualExpenseCents / highestValue) * chartInnerHeight;
    const projectedHeight = (month.projectedExpenseCents / highestValue) * chartInnerHeight;
    const totalHeight = (month.totalExpenseCents / highestValue) * chartInnerHeight;

    return {
      month,
      labelX: groupX + groupBarWidth / 2,
      actual: {
        x: groupX,
        y: PADDING_Y + chartInnerHeight - actualHeight,
        height: actualHeight,
      },
      projected: {
        x: groupX + barWidth + BAR_GAP,
        y: PADDING_Y + chartInnerHeight - projectedHeight,
        height: projectedHeight,
      },
      total: {
        x: groupX + (barWidth + BAR_GAP) * 2,
        y: PADDING_Y + chartInnerHeight - totalHeight,
        height: totalHeight,
      },
    };
  });

  const stackedBars = data.map((month, index) => {
    const groupX = PADDING_X + groupWidth * index + groupWidth * 0.2;
    const stackedWidth = groupWidth * 0.6;
    const actualHeight = (month.actualExpenseCents / highestValue) * chartInnerHeight;
    const projectedHeight = (month.projectedExpenseCents / highestValue) * chartInnerHeight;

    return {
      month,
      x: groupX,
      width: stackedWidth,
      actual: {
        y: PADDING_Y + chartInnerHeight - actualHeight,
        height: actualHeight,
      },
      projected: {
        y: PADDING_Y + chartInnerHeight - actualHeight - projectedHeight,
        height: projectedHeight,
      },
      labelX: groupX + stackedWidth / 2,
    };
  });

  const actualPath = createLinePath(linePoints.map((point) => [point.x, point.actualY]));
  const projectedPath = createLinePath(linePoints.map((point) => [point.x, point.projectedY]));
  const totalPath = createLinePath(linePoints.map((point) => [point.x, point.totalY]));
  const totalAreaPath = createAreaPath(linePoints.map((point) => [point.x, point.totalY]), PADDING_Y + chartInnerHeight);

  let chartBody: React.ReactNode;

  switch (chartType) {
    case "line":
      chartBody = (
        <>
          <path d={actualPath} fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={projectedPath} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6" />
          <path d={totalPath} fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {linePoints.flatMap((point) => [
            <circle key={`${point.month.monthLabel}-actual`} cx={point.x} cy={point.actualY} r="3.5" fill="#fb923c" />,
            <circle key={`${point.month.monthLabel}-projected`} cx={point.x} cy={point.projectedY} r="3.5" fill="#22d3ee" />,
            <circle key={`${point.month.monthLabel}-total`} cx={point.x} cy={point.totalY} r="4" fill="#c084fc" />,
          ])}
        </>
      );
      break;
    case "area":
      chartBody = (
        <>
          <path d={totalAreaPath} fill="rgba(192, 132, 252, 0.22)" stroke="none" />
          <path d={totalPath} fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={actualPath} fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={projectedPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 6" />
        </>
      );
      break;
    case "stacked-bar":
      chartBody = (
        <>
          {stackedBars.map((bar) => (
            <g key={bar.month.monthLabel}>
              <rect x={bar.x} y={bar.actual.y} width={bar.width} height={bar.actual.height} rx="6" fill="#fb923c" />
              <rect x={bar.x} y={bar.projected.y} width={bar.width} height={bar.projected.height} rx="6" fill="#22d3ee" />
            </g>
          ))}
        </>
      );
      break;
    case "combo":
      chartBody = (
        <>
          {bars.map((bar) => (
            <g key={bar.month.monthLabel}>
              <rect x={bar.actual.x} y={bar.actual.y} width={barWidth} height={bar.actual.height} rx="4" fill="#fb923c" />
              <rect x={bar.projected.x} y={bar.projected.y} width={barWidth} height={bar.projected.height} rx="4" fill="#22d3ee" />
            </g>
          ))}
          <path d={totalPath} fill="none" stroke="#c084fc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {linePoints.map((point) => (
            <circle key={`${point.month.monthLabel}-total`} cx={point.x} cy={point.totalY} r="4" fill="#c084fc" />
          ))}
        </>
      );
      break;
    default:
      chartBody = (
        <>
          {bars.map((bar) => (
            <g key={bar.month.monthLabel}>
              <rect x={bar.actual.x} y={bar.actual.y} width={barWidth} height={bar.actual.height} rx="4" fill="#fb923c" />
              <rect x={bar.projected.x} y={bar.projected.y} width={barWidth} height={bar.projected.height} rx="4" fill="#22d3ee" />
              <rect x={bar.total.x} y={bar.total.y} width={barWidth} height={bar.total.height} rx="4" fill="#c084fc" />
            </g>
          ))}
        </>
      );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-300">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
          Realizado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          Projetado do mês
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
          Total do mês
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-80 w-full">
            {gridValues.map((value) => {
              const y = PADDING_Y + chartInnerHeight - (value / highestValue) * chartInnerHeight;

              return (
                <g key={value}>
                  <line x1={PADDING_X} y1={y} x2={CHART_WIDTH - PADDING_X} y2={y} stroke="rgba(148, 163, 184, 0.14)" strokeDasharray="4 4" />
                  <text x={0} y={y + 4} fill="#94a3b8" fontSize="11">
                    {formatCurrencyFromCents(value)}
                  </text>
                </g>
              );
            })}

            {chartBody}

            {data.map((month, index) => (
              <rect
                key={`${month.monthLabel}-drilldown-hitbox`}
                className="cursor-pointer"
                fill="transparent"
                height={CHART_HEIGHT - PADDING_Y}
                onClick={() => setSelectedMonthIndex(month.monthIndex)}
                width={groupWidth}
                x={PADDING_X + groupWidth * index}
                y={0}
              />
            ))}

            {(chartType === "stacked-bar" ? stackedBars : bars).map((bar) => (
              <text key={`${bar.month.monthLabel}-label`} x={bar.labelX} y={CHART_HEIGHT - 6} textAnchor="middle" fill="#cbd5e1" fontSize="11">
                {bar.month.monthLabel.slice(0, 3)}
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((month) => (
          <button
            key={month.monthLabel}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
            onClick={() => setSelectedMonthIndex(month.monthIndex)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{month.monthLabel}</p>
                <p className="mt-1 text-xs text-slate-400">Total: {formatCurrencyFromCents(month.totalExpenseCents)}</p>
              </div>
              {month.projectedExpenseCents > 0 ? (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  Projetado
                </span>
              ) : null}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              <p>Realizado: {formatCurrencyFromCents(month.actualExpenseCents)}</p>
              <p>Projetado: {formatCurrencyFromCents(month.projectedExpenseCents)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function createLinePath(points: Array<readonly [number, number]>) {
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function createAreaPath(points: Array<readonly [number, number]>, baselineY: number) {
  if (points.length === 0) {
    return "";
  }

  const line = createLinePath(points);
  const [firstX] = points[0];
  const [lastX] = points[points.length - 1];
  return `${line} L${lastX} ${baselineY} L${firstX} ${baselineY} Z`;
}
