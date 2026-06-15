import type { Balance, CurrencyCode, Expense, Settlement } from "./types";

export function calculateBalances(input: {
  currentUserContactId: string;
  expenses: Expense[];
  settlements: Settlement[];
  currency: CurrencyCode;
}): Balance[] {
  const ledger = new Map<string, number>();

  for (const expense of input.expenses) {
    if (expense.currency !== input.currency) continue;

    for (const split of expense.splits) {
      if (split.contactId === expense.paidByContactId) continue;

      if (expense.paidByContactId === input.currentUserContactId) {
        add(ledger, split.contactId, split.amountCents);
      } else if (split.contactId === input.currentUserContactId) {
        add(ledger, expense.paidByContactId, -split.amountCents);
      }
    }
  }

  for (const settlement of input.settlements) {
    if (settlement.currency !== input.currency) continue;

    if (settlement.toContactId === input.currentUserContactId) {
      add(ledger, settlement.fromContactId, -settlement.amountCents);
    }

    if (settlement.fromContactId === input.currentUserContactId) {
      add(ledger, settlement.toContactId, settlement.amountCents);
    }
  }

  return [...ledger.entries()]
    .filter(([, amountCents]) => amountCents !== 0)
    .map(([contactId, amountCents]) => ({
      contactId,
      amountCents,
      currency: input.currency,
    }))
    .sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents));
}

function add(ledger: Map<string, number>, contactId: string, amountCents: number): void {
  ledger.set(contactId, (ledger.get(contactId) ?? 0) + amountCents);
}
