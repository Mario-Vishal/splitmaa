import type { CurrencyCode, ExpenseSplit } from "./types";

const currencyDecimals: Record<CurrencyCode, number> = {
  USD: 2,
  INR: 2,
};

export const currencyExponent: Record<CurrencyCode, number> = currencyDecimals;

export function toCents(amount: string | number): number {
  return normalizeAmountText(amount, "USD");
}

export function normalizeAmountText(amount: string | number, currency: CurrencyCode): number {
  const raw = typeof amount === "number" ? String(amount) : amount.trim();
  const normalized = raw.replace(/[$,\u20b9,\s]/g, "");
  const exponent = currencyExponent[currency];

  if (!new RegExp(`^\\d+(\\.\\d{1,${exponent}})?$`).test(normalized)) {
    throw new Error(`Invalid money amount: ${amount}`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  const scale = 10 ** exponent;
  const minorUnits = Number(whole) * scale + Number(fraction.padEnd(exponent, "0"));

  if (!Number.isSafeInteger(minorUnits) || minorUnits <= 0) {
    throw new Error("Money amount must be greater than zero");
  }

  return minorUnits;
}

export function formatMoney(amountCents: number, currency: CurrencyCode): string {
  assertCents(amountCents, "amountCents");

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currencyDecimals[currency],
  }).format(amountCents / 100);
}

export function splitEqually(totalCents: number, memberIds: string[]): ExpenseSplit[] {
  assertCents(totalCents, "totalCents");

  if (memberIds.length === 0) {
    throw new Error("At least one member is required for a split");
  }

  const baseShare = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents % memberIds.length;

  return memberIds.map((contactId, index) => ({
    contactId,
    amountCents: baseShare + (index < remainder ? 1 : 0),
  }));
}

export function assertCents(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be integer cents`);
  }
}
