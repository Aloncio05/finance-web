import { MONTH_NAMES_PT } from "@/lib/constants";

export function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

export function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getMonthValue(date = new Date()) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getMonthRange(monthValue?: string) {
  const safeValue =
    monthValue && /^\d{4}-\d{2}$/.test(monthValue)
      ? monthValue
      : getMonthValue();
  const [year, month] = safeValue.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    value: safeValue,
    start,
    end,
    label: `${MONTH_NAMES_PT[start.getMonth()]} de ${start.getFullYear()}`,
  };
}

export function getYearValue(date = new Date()) {
  return `${date.getFullYear()}`;
}

export function getYearRange(yearValue?: string) {
  const safeValue = yearValue && /^\d{4}$/.test(yearValue) ? yearValue : getYearValue();
  const year = Number(safeValue);
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  return {
    value: safeValue,
    year,
    start,
    end,
    label: `Ano de ${year}`,
  };
}

export function parseAmountToCents(rawValue: string) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
