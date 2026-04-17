import { formatCurrencyFromCents } from "@/lib/format";

export type AnnualChartType = "grouped-bar" | "line" | "area" | "stacked-bar" | "combo";

type AnnualProjectionMonth = {
  monthLabel: string;
  actualExpenseCents: number;
  projectedExpenseCents: number;
  totalExpenseCents: number;
};

type AnnualProjectionChartProps = {
  data: AnnualProjectionMonth[];
  chartType: AnnualChartType;
};

const CHART_WIDTH = 720;
const CHART_HEIGHT = 280;
const PADDING_X = 32;
const PADDING_Y = 24;
const BAR_GAP = 6;

export function AnnualProjectionChart({ data, chartType }: AnnualProjectionChartProps) {
  const highestValue = data.reduce((max, month) => Math.max(max, month.totalExpenseCents), 0);

  if (highestValue === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
        Cadastre despesas ou marque recorrências para acompanhar a visão anual.
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
