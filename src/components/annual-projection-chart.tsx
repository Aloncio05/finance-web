import { formatCurrencyFromCents } from '@/lib/format';

type AnnualProjectionChartProps = {
  data: Array<{
    monthLabel: string;
    actualExpenseCents: number;
    projectedExpenseCents: number;
    totalExpenseCents: number;
  }>;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING_X = 32;
const PADDING_Y = 24;

export function AnnualProjectionChart({ data }: AnnualProjectionChartProps) {
  const highestValue = data.reduce((max, month) => Math.max(max, month.totalExpenseCents), 0);

  if (highestValue === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
        Cadastre despesas ou marque recorrências para acompanhar a projeção anual.
      </div>
    );
  }

  const chartInnerWidth = CHART_WIDTH - PADDING_X * 2;
  const chartInnerHeight = CHART_HEIGHT - PADDING_Y * 2;
  const stepX = data.length > 1 ? chartInnerWidth / (data.length - 1) : 0;
  const gridValues = Array.from({ length: 4 }, (_, index) => Math.round((highestValue / 4) * (4 - index)));

  const points = data.map((month, index) => {
    const x = PADDING_X + stepX * index;
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

  const actualLine = points.map((point) => `${point.x},${point.actualY}`).join(' ');
  const projectedLine = points.map((point) => `${point.x},${point.projectedY}`).join(' ');
  const totalLine = points.map((point) => `${point.x},${point.totalY}`).join(' ');

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

            <polyline fill="none" stroke="#fb923c" strokeWidth="3" points={actualLine} />
            <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeDasharray="6 6" points={projectedLine} />
            <polyline fill="none" stroke="#c084fc" strokeWidth="3" points={totalLine} />

            {points.map((point) => (
              <g key={point.month.monthLabel}>
                <circle cx={point.x} cy={point.actualY} r="4" fill="#fb923c" />
                <circle cx={point.x} cy={point.projectedY} r="3.5" fill="#22d3ee" />
                <circle cx={point.x} cy={point.totalY} r="4" fill="#c084fc" />
              </g>
            ))}

            {points.map((point) => (
              <text key={`${point.month.monthLabel}-label`} x={point.x} y={CHART_HEIGHT - 6} textAnchor="middle" fill="#cbd5e1" fontSize="11">
                {point.month.monthLabel.slice(0, 3)}
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((month) => (
          <article key={month.monthLabel} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
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
          </article>
        ))}
      </div>
    </div>
  );
}
