'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type CategoryChartProps = {
  data: Array<{
    id?: string;
    name: string;
    total: number;
    color: string;
  }>;
  onSelectCategory?: (categoryId: string) => void;
  selectedCategoryId?: string | null;
};

export function CategoryChart({ data, onSelectCategory, selectedCategoryId }: CategoryChartProps) {
  if (data.length === 0) {
      return (
        <div className="flex h-72 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 text-sm text-slate-400">
        Cadastre despesas para enxergar a distribuição por categoria.
        </div>
      );
  }

  return (
    <div className="h-72 rounded-3xl border border-white/10 bg-slate-950/30 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius={72}
            outerRadius={104}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                className={entry.id ? "cursor-pointer outline-none" : undefined}
                fill={entry.color}
                opacity={!selectedCategoryId || selectedCategoryId === entry.id ? 1 : 0.45}
                onClick={() => {
                  if (entry.id) {
                    onSelectCategory?.(entry.id);
                  }
                }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const safeValue = typeof value === 'number' ? value : Number(value ?? 0);

              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(safeValue / 100);
            }}
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderRadius: 16,
              color: '#f8fafc',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
