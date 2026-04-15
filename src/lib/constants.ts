import { TransactionType } from "@/generated/prisma/client";

export const DEFAULT_CATEGORIES = [
  { name: "Salário", type: TransactionType.INCOME, color: "#2563eb" },
  { name: "Freelance", type: TransactionType.INCOME, color: "#0891b2" },
  { name: "Investimentos", type: TransactionType.INCOME, color: "#7c3aed" },
  { name: "Moradia", type: TransactionType.EXPENSE, color: "#ef4444" },
  { name: "Alimentação", type: TransactionType.EXPENSE, color: "#f97316" },
  { name: "Transporte", type: TransactionType.EXPENSE, color: "#eab308" },
  { name: "Lazer", type: TransactionType.EXPENSE, color: "#14b8a6" },
  { name: "Saúde", type: TransactionType.EXPENSE, color: "#ec4899" },
] as const;

export const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
