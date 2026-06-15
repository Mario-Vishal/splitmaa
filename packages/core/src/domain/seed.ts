import { splitEqually } from "./money";
import type { Contact, Expense, Group, LocalAppState } from "./types";

const seedDate = "2026-06-14T00:00:00.000Z";

export const seedContacts: Contact[] = [
  contact("contact_you", "You", ["me", "mario"]),
  contact("contact_alex", "Alex", []),
  contact("contact_priya", "Priya", []),
  contact("contact_rahul", "Rahul", []),
];

export const seedGroups: Group[] = [
  {
    id: "group_goa",
    name: "Goa Trip",
    memberIds: ["contact_you", "contact_alex", "contact_priya"],
    defaultCurrency: "USD",
    createdAt: seedDate,
    updatedAt: seedDate,
  },
];

export const seedExpenses: Expense[] = [
  {
    id: "expense_dinner",
    groupId: "group_goa",
    description: "Dinner",
    amountCents: 6000,
    currency: "USD",
    category: "food",
    paymentType: "card",
    paidByContactId: "contact_you",
    splitWithContactIds: ["contact_you", "contact_alex", "contact_priya"],
    splits: splitEqually(6000, ["contact_you", "contact_alex", "contact_priya"]),
    source: "assistant",
    expenseDate: seedDate,
    createdAt: seedDate,
    updatedAt: seedDate,
  },
];

export function createInitialLocalAppState(date = new Date().toISOString()): LocalAppState {
  return {
    schemaVersion: 1,
    currentUserContactId: "contact_you",
    contacts: seedContacts,
    groups: seedGroups,
    expenses: seedExpenses,
    settlements: [],
    aiActionLogs: [],
    updatedAt: date,
  };
}

function contact(id: string, displayName: string, aliases: string[]): Contact {
  return {
    id,
    displayName,
    normalizedDisplayName: displayName.toLowerCase(),
    aliases,
    createdAt: seedDate,
    updatedAt: seedDate,
  };
}
