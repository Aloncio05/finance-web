import { formatCurrencyFromCents } from "@/lib/format";

type AnnualProjectionChartProps = {
  data: Array<{
    monthLabel: string;
    actualExpenseCents: number;
    projectedExpenseCents: number;
  }>;
};

export function AnnualProjectionChart({ data }: AnnualProjectionChartProps) {
  const highestValue = data.reduce((max, month) => Math.max(max, month.actualExpenseCents + month.projectedExpenseCents), 0);

  if (highestValue === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
        Cadastre despesas ou marque recorrências para acompanhar a projeção anual.
      </div>
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
          Projetado
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((month) => {
          const total = month.actualExpenseCents + month.projectedExpenseCents;
          const actualHeight = (month.actualExpenseCents / highestValue) * 100;
          const projectedHeight = (month.projectedExpenseCents / highestValue) * 100;

          return (
            <article key={month.monthLabel} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{month.monthLabel}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatCurrencyFromCents(total)}</p>
                </div>
                {month.projectedExpenseCents > 0 ? (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                    Projetado
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex h-40 items-end gap-3">
                <div className="flex flex-1 items-end gap-2">
                  <div className="flex-1 overflow-hidden rounded-t-2xl bg-white/5">
                    <div className="w-full rounded-t-2xl bg-orange-400" style={{ height: `${actualHeight}%`, minHeight: month.actualExpenseCents > 0 ? 10 : 0 }} />
                  </div>
                  <div className="flex-1 overflow-hidden rounded-t-2xl bg-white/5">
                    <div className="w-full rounded-t-2xl bg-cyan-400" style={{ height: `${projectedHeight}%`, minHeight: month.projectedExpenseCents > 0 ? 10 : 0 }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                <p>Realizado: {formatCurrencyFromCents(month.actualExpenseCents)}</p>
                <p>Projetado: {formatCurrencyFromCents(month.projectedExpenseCents)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
