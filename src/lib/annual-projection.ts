import { MONTH_NAMES_PT } from "@/lib/constants";

type ProjectionTransaction = {
  id: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  transactionDate: Date;
  recurrenceType: "NONE" | "FIXED" | "VARIABLE";
  carriedFromId: string | null;
};

export type AnnualProjectionMonth = {
  monthIndex: number;
  monthLabel: string;
  actualIncomeCents: number;
  actualExpenseCents: number;
  projectedExpenseCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  cumulativeExpenseCents: number;
  isFutureMonth: boolean;
};

export type AnnualProjectionSummary = {
  months: AnnualProjectionMonth[];
  totalActualIncomeCents: number;
  totalActualExpenseCents: number;
  totalProjectedExpenseCents: number;
  totalExpenseCents: number;
};

export function buildAnnualProjection(
  year: number,
  yearTransactions: ProjectionTransaction[],
  recurringExpenseHistory: ProjectionTransaction[],
  today = new Date(),
): AnnualProjectionSummary {
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const months = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    monthLabel: MONTH_NAMES_PT[monthIndex],
    actualIncomeCents: 0,
    actualExpenseCents: 0,
    projectedExpenseCents: 0,
    totalExpenseCents: 0,
    balanceCents: 0,
    cumulativeExpenseCents: 0,
    isFutureMonth: new Date(year, monthIndex, 1) > currentMonthStart,
  }));

  for (const transaction of yearTransactions) {
    const monthIndex = transaction.transactionDate.getMonth();
    const bucket = months[monthIndex];

    if (transaction.type === "INCOME") {
      bucket.actualIncomeCents += transaction.amountCents;
      continue;
    }

    bucket.actualExpenseCents += transaction.amountCents;
  }

  const recurringById = new Map(recurringExpenseHistory.map((transaction) => [transaction.id, transaction]));
  const chainRootCache = new Map<string, string>();
  const recurringByRoot = new Map<string, ProjectionTransaction[]>();

  for (const transaction of recurringExpenseHistory) {
    const rootId = resolveChainRootId(transaction, recurringById, chainRootCache);
    const chain = recurringByRoot.get(rootId) ?? [];
    chain.push(transaction);
    recurringByRoot.set(rootId, chain);
  }

  for (const chain of recurringByRoot.values()) {
    chain.sort((left, right) => left.transactionDate.getTime() - right.transactionDate.getTime());

    let latestKnownAmount: number | null = null;

    for (const transaction of chain) {
      if (transaction.transactionDate.getFullYear() < year) {
        latestKnownAmount = transaction.amountCents;
      }
    }

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 1);
      const matchingTransactions = chain.filter(
        (transaction) => transaction.transactionDate >= monthStart && transaction.transactionDate < monthEnd,
      );

      if (matchingTransactions.length > 0) {
        latestKnownAmount = matchingTransactions[matchingTransactions.length - 1]?.amountCents ?? latestKnownAmount;
        continue;
      }

      if (months[monthIndex].isFutureMonth && latestKnownAmount) {
        months[monthIndex].projectedExpenseCents += latestKnownAmount;
      }
    }
  }

  let runningExpenseTotal = 0;

  for (const month of months) {
    month.totalExpenseCents = month.actualExpenseCents + month.projectedExpenseCents;
    month.balanceCents = month.actualIncomeCents - month.totalExpenseCents;
    runningExpenseTotal += month.totalExpenseCents;
    month.cumulativeExpenseCents = runningExpenseTotal;
  }

  const totalActualIncomeCents = months.reduce((sum, month) => sum + month.actualIncomeCents, 0);
  const totalActualExpenseCents = months.reduce((sum, month) => sum + month.actualExpenseCents, 0);
  const totalProjectedExpenseCents = months.reduce((sum, month) => sum + month.projectedExpenseCents, 0);

  return {
    months,
    totalActualIncomeCents,
    totalActualExpenseCents,
    totalProjectedExpenseCents,
    totalExpenseCents: totalActualExpenseCents + totalProjectedExpenseCents,
  };
}

function resolveChainRootId(
  transaction: ProjectionTransaction,
  transactionsById: Map<string, ProjectionTransaction>,
  cache: Map<string, string>,
): string {
  const cached = cache.get(transaction.id);

  if (cached) {
    return cached;
  }

  if (!transaction.carriedFromId) {
    cache.set(transaction.id, transaction.id);
    return transaction.id;
  }

  const parent = transactionsById.get(transaction.carriedFromId);

  if (!parent) {
    cache.set(transaction.id, transaction.id);
    return transaction.id;
  }

  const rootId = resolveChainRootId(parent, transactionsById, cache);
  cache.set(transaction.id, rootId);
  return rootId;
}
