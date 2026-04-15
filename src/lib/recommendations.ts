type RecommendationBucket = {
  label: string;
  amountCents: number;
  accentClassName: string;
};

type RecommendationSummary = {
  title: string;
  description: string;
  buckets: RecommendationBucket[];
};

export function getMonthlyPlan(totalIncome: number, totalExpense: number): RecommendationSummary {
  const leftover = totalIncome - totalExpense;

  if (totalIncome <= 0) {
    return {
      title: "Registre suas entradas primeiro",
      description:
        "Assim que você cadastrar suas receitas do mês, eu consigo sugerir uma divisão mais útil entre reserva, futuro e lazer.",
      buckets: [],
    };
  }

  if (leftover <= 0) {
    return {
      title: "Prioridade: recuperar margem",
      description:
        "Neste mês não houve sobra. Vale reduzir gastos flexíveis antes de pensar em investir e voltar a construir uma reserva.",
      buckets: [],
    };
  }

  const ratio = leftover / totalIncome;

  if (ratio < 0.05) {
    return buildPlan(
      leftover,
      [
        { label: "Reserva", percentage: 0.8, accentClassName: "text-cyan-300" },
        { label: "Lazer", percentage: 0.2, accentClassName: "text-amber-300" },
      ],
      "Sobra apertada, plano defensivo",
      "Como a sobra está pequena em relação ao que entrou, a melhor regra simples é proteger quase tudo em reserva e separar só um pouco para lazer.",
    );
  }

  if (ratio < 0.15) {
    return buildPlan(
      leftover,
      [
        { label: "Reserva", percentage: 0.6, accentClassName: "text-cyan-300" },
        { label: "Investir", percentage: 0.2, accentClassName: "text-violet-300" },
        { label: "Lazer", percentage: 0.2, accentClassName: "text-amber-300" },
      ],
      "Sobra equilibrada para organizar o próximo passo",
      "Aqui dá para dividir a sobra entre segurança, futuro e qualidade de vida sem concentrar tudo em um único destino.",
    );
  }

  return buildPlan(
    leftover,
    [
      { label: "Reserva", percentage: 0.4, accentClassName: "text-cyan-300" },
      { label: "Investir", percentage: 0.3, accentClassName: "text-violet-300" },
      { label: "Lazer", percentage: 0.3, accentClassName: "text-amber-300" },
    ],
    "Sobra mais confortável, com espaço para avançar",
    "Com uma folga maior no mês, você pode continuar fortalecendo a reserva e ainda separar parte do valor para investir e curtir com mais tranquilidade.",
  );
}

function buildPlan(
  leftover: number,
  buckets: Array<{ label: string; percentage: number; accentClassName: string }>,
  title: string,
  description: string,
): RecommendationSummary {
  let allocated = 0;

  const resolvedBuckets = buckets.map((bucket, index) => {
    const isLast = index === buckets.length - 1;
    const amountCents = isLast ? leftover - allocated : Math.round(leftover * bucket.percentage);
    allocated += amountCents;

    return {
      label: bucket.label,
      amountCents,
      accentClassName: bucket.accentClassName,
    };
  });

  return {
    title,
    description,
    buckets: resolvedBuckets,
  };
}
