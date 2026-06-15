import type { CurrencyCode, ExpenseSplit } from "./types";

const currencyDecimals: Record<CurrencyCode, number> = {
  USD: 2,
  INR: 2,
};

export function toCents(amount: string | number): number {
  const raw = typeof amount === "number" ? String(amount) : amount.trim();
  const normalized = raw.replace(/[$,\u20b9\u20ac\u00a3\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid money amount: ${amount}`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error("Money amount must be greater than zero");
  }

  return cents;
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
