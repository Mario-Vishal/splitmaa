import { calculateBalances } from "../domain/balances";
import { formatMoney } from "../domain/money";
import type { AiActionLog, CurrencyCode, Expense, LocalAppState, Settlement } from "../domain/types";
import type { AppAction } from "../actions/schemas";

export type NavigableEntityType = "contact" | "group" | "expense" | "settlement" | "activity_log";

export type NavigableRecord = {
  entityType: NavigableEntityType;
  id: string;
  title: string;
  subtitle: string;
  amountCents?: number;
  currency?: CurrencyCode;
  createdAt: string;
  highlightId?: string;
};

export type QueryAnswer = {
  answer: string;
  records: NavigableRecord[];
};

type DateRange = {
  startDate?: string;
  endDate?: string;
};

export function answerLocalQuery(state: LocalAppState, action: AppAction): QueryAnswer {
  switch (action.type) {
    case "QUERY_BALANCE":
      return answerBalanceQuery(state, action);
    case "QUERY_FINANCIAL_SUMMARY":
      return answerFinancialSummary(state, action);
    case "SEARCH_RECORDS":
      return answerSearchRecords(state, action);
    case "OPEN_RECORD":
      return answerOpenRecord(state, action);
    case "SHOW_SEARCH_RESULTS":
      return {
        answer: "Search results are ready.",
        records: [],
      };
    default:
      return {
        answer: "No local query was requested.",
        records: [],
      };
  }
}

export function answerBalanceQuery(
  state: LocalAppState,
  action: Extract<AppAction, { type: "QUERY_BALANCE" }>,
): QueryAnswer {
  const scoped = filterStateByDateRange(state, action.dateRange);
  const balances = calculateBalances({
    currentUserContactId: scoped.currentUserContactId,
    expenses: scoped.expenses,
    settlements: scoped.settlements,
    currency: action.currency,
  });
  const contact = action.personName ? findContactByName(scoped, action.personName) : undefined;
  const balance = contact ? balances.find((item) => item.contactId === contact.id) : balances[0];

  if (!balance) {
    return {
      answer: action.personName
        ? `No open ${action.currency} balance found for ${action.personName}.`
        : `No open ${action.currency} balance found.`,
      records: contact ? [contactRecord(contact)] : [],
    };
  }

  const name = scoped.contacts.find((item) => item.id === balance.contactId)?.displayName ?? "That person";
  const amount = formatMoney(Math.abs(balance.amountCents), balance.currency);
  const answer =
    balance.amountCents > 0 ? `${name} owes you ${amount}.` : `You owe ${name} ${amount}.`;

  return {
    answer,
    records: contact ? [contactRecord(contact)] : [],
  };
}

export function answerFinancialSummary(
  state: LocalAppState,
  action: Extract<AppAction, { type: "QUERY_FINANCIAL_SUMMARY" }>,
): QueryAnswer {
  const scoped = filterStateByDateRange(state, action.dateRange);
  const expenses = filterExpensesByAction(scoped, action);
  const balances = calculateBalances({
    currentUserContactId: scoped.currentUserContactId,
    expenses: scoped.expenses,
    settlements: scoped.settlements,
    currency: action.currency,
  });
  const positive = balances.filter((item) => item.amountCents > 0);
  const negative = balances.filter((item) => item.amountCents < 0);
  const contact = action.personName ? findContactByName(scoped, action.personName) : undefined;
  const group = action.groupName ? findGroupByName(scoped, action.groupName) : undefined;

  switch (action.summaryType) {
    case "total_owed_to_me": {
      const total = positive.reduce((sum, item) => sum + item.amountCents, 0);
      return {
        answer: `You are owed ${formatMoney(total, action.currency)}.`,
        records: positive.map((item) => contactRecordById(scoped, item.contactId)).filter(isRecord),
      };
    }
    case "total_i_owe": {
      const total = negative.reduce((sum, item) => sum + Math.abs(item.amountCents), 0);
      return {
        answer: `You owe ${formatMoney(total, action.currency)}.`,
        records: negative.map((item) => contactRecordById(scoped, item.contactId)).filter(isRecord),
      };
    }
    case "net_balance": {
      const net = balances.reduce((sum, item) => sum + item.amountCents, 0);
      const direction = net >= 0 ? "ahead" : "behind";
      return {
        answer: `Your net ${action.currency} balance is ${formatMoney(Math.abs(net), action.currency)} ${direction}.`,
        records: balances.map((item) => contactRecordById(scoped, item.contactId)).filter(isRecord),
      };
    }
    case "total_spent": {
      const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
      return {
        answer: `Total logged spending is ${formatMoney(total, action.currency)}.`,
        records: expenses.map((expense) => expenseRecord(scoped, expense)),
      };
    }
    case "person_balance": {
      if (!contact) {
        return { answer: `I could not find ${action.personName ?? "that person"} locally.`, records: [] };
      }
      const balance = balances.find((item) => item.contactId === contact.id);
      if (!balance) return { answer: `No open balance found for ${contact.displayName}.`, records: [contactRecord(contact)] };
      const amount = formatMoney(Math.abs(balance.amountCents), balance.currency);
      return {
        answer:
          balance.amountCents > 0
            ? `${contact.displayName} owes you ${amount}.`
            : `You owe ${contact.displayName} ${amount}.`,
        records: [contactRecord(contact)],
      };
    }
    case "group_total": {
      if (!group) {
        return { answer: `I could not find ${action.groupName ?? "that group"} locally.`, records: [] };
      }
      const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
      const total = groupExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
      return {
        answer: `${group.name} has ${formatMoney(total, action.currency)} logged.`,
        records: [groupRecord(group, groupExpenses.length), ...groupExpenses.map((expense) => expenseRecord(scoped, expense))],
      };
    }
  }
}

export function answerSearchRecords(
  state: LocalAppState,
  action: Extract<AppAction, { type: "SEARCH_RECORDS" }>,
): QueryAnswer {
  const results = searchLocalRecords(state, action);
  return {
    answer: results.length ? `Found ${results.length} local result${results.length === 1 ? "" : "s"}.` : "No local records matched.",
    records: results,
  };
}

export function answerOpenRecord(
  state: LocalAppState,
  action: Extract<AppAction, { type: "OPEN_RECORD" }>,
): QueryAnswer {
  const record =
    (action.recordId ? findRecordById(state, action.entityType, action.recordId) : undefined) ??
    (action.searchQuery
      ? searchLocalRecords(state, {
          ...action,
          type: "SEARCH_RECORDS",
          query: action.searchQuery,
          entityTypes: [action.entityType],
          limit: 1,
        })[0]
      : undefined);

  if (!record) {
    return {
      answer: "I could not find that local record.",
      records: [],
    };
  }

  return {
    answer: `Opening ${record.title}.`,
    records: [{ ...record, highlightId: action.highlightRecordId ?? record.id }],
  };
}

export function searchLocalRecords(
  state: LocalAppState,
  action: Extract<AppAction, { type: "SEARCH_RECORDS" }>,
): NavigableRecord[] {
  const query = normalize(action.query);
  const scoped = filterStateByDateRange(state, action.dateRange);
  const person = action.personName ? findContactByName(scoped, action.personName) : undefined;
  const group = action.groupName ? findGroupByName(scoped, action.groupName) : undefined;
  const records: NavigableRecord[] = [];

  if (action.entityTypes.includes("contact")) {
    records.push(
      ...scoped.contacts
        .filter((contact) => matchText(query, [contact.displayName, ...contact.aliases, contact.email, contact.phone]))
        .map(contactRecord),
    );
  }

  if (action.entityTypes.includes("group")) {
    records.push(
      ...scoped.groups
        .filter((item) => matchText(query, [item.name]) && (!person || item.memberIds.includes(person.id)))
        .map((item) => groupRecord(item, scoped.expenses.filter((expense) => expense.groupId === item.id).length)),
    );
  }

  if (action.entityTypes.includes("expense")) {
    records.push(
      ...scoped.expenses
        .filter((expense) => {
          if (action.currency && expense.currency !== action.currency) return false;
          if (action.category && expense.category !== action.category) return false;
          if (person && !expense.splitWithContactIds.includes(person.id) && expense.paidByContactId !== person.id) {
            return false;
          }
          if (group && expense.groupId !== group.id) return false;
          return matchText(query, [expense.description, expense.category, expense.paymentType]);
        })
        .map((expense) => expenseRecord(scoped, expense)),
    );
  }

  if (action.entityTypes.includes("settlement")) {
    records.push(
      ...scoped.settlements
        .filter((settlement) => {
          if (action.currency && settlement.currency !== action.currency) return false;
          if (person && settlement.fromContactId !== person.id && settlement.toContactId !== person.id) return false;
          return matchText(query, [
            contactName(scoped, settlement.fromContactId),
            contactName(scoped, settlement.toContactId),
            settlement.paymentType,
          ]);
        })
        .map((settlement) => settlementRecord(scoped, settlement)),
    );
  }

  if (action.entityTypes.includes("activity_log")) {
    records.push(
      ...scoped.aiActionLogs
        .filter((log) =>
          matchText(query, [log.transcript, log.parsedActionType, log.executionStatus, log.parserName]),
        )
        .map(activityRecord),
    );
  }

  return records
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, action.limit);
}

function filterExpensesByAction(
  state: LocalAppState,
  action: Extract<AppAction, { type: "QUERY_FINANCIAL_SUMMARY" }>,
): Expense[] {
  const group = action.groupName ? findGroupByName(state, action.groupName) : undefined;
  const contact = action.personName ? findContactByName(state, action.personName) : undefined;

  return state.expenses.filter((expense) => {
    if (expense.currency !== action.currency) return false;
    if (group && expense.groupId !== group.id) return false;
    if (contact && !expense.splitWithContactIds.includes(contact.id) && expense.paidByContactId !== contact.id) {
      return false;
    }
    return true;
  });
}

function filterStateByDateRange(state: LocalAppState, dateRange?: DateRange): LocalAppState {
  if (!dateRange?.startDate && !dateRange?.endDate) return state;

  return {
    ...state,
    expenses: state.expenses.filter((expense) => inRange(expense.expenseDate, dateRange)),
    settlements: state.settlements.filter((settlement) => inRange(settlement.createdAt, dateRange)),
    aiActionLogs: state.aiActionLogs.filter((log) => inRange(log.createdAt, dateRange)),
  };
}

function findRecordById(
  state: LocalAppState,
  entityType: NavigableEntityType,
  id: string,
): NavigableRecord | undefined {
  switch (entityType) {
    case "contact": {
      const contact = state.contacts.find((item) => item.id === id);
      return contact ? contactRecord(contact) : undefined;
    }
    case "group": {
      const group = state.groups.find((item) => item.id === id);
      return group ? groupRecord(group, state.expenses.filter((expense) => expense.groupId === group.id).length) : undefined;
    }
    case "expense": {
      const expense = state.expenses.find((item) => item.id === id);
      return expense ? expenseRecord(state, expense) : undefined;
    }
    case "settlement": {
      const settlement = state.settlements.find((item) => item.id === id);
      return settlement ? settlementRecord(state, settlement) : undefined;
    }
    case "activity_log": {
      const log = state.aiActionLogs.find((item) => item.id === id);
      return log ? activityRecord(log) : undefined;
    }
  }
}

function contactRecord(contact: LocalAppState["contacts"][number]): NavigableRecord {
  return {
    entityType: "contact",
    id: contact.id,
    title: contact.displayName,
    subtitle: contact.email ?? contact.phone ?? "Local contact",
    createdAt: contact.createdAt,
  };
}

function contactRecordById(state: LocalAppState, contactId: string): NavigableRecord | undefined {
  const contact = state.contacts.find((item) => item.id === contactId);
  return contact ? contactRecord(contact) : undefined;
}

function groupRecord(group: LocalAppState["groups"][number], expenseCount: number): NavigableRecord {
  return {
    entityType: "group",
    id: group.id,
    title: group.name,
    subtitle: `${group.memberIds.length} members, ${expenseCount} expenses`,
    currency: group.defaultCurrency,
    createdAt: group.createdAt,
  };
}

function expenseRecord(state: LocalAppState, expense: Expense): NavigableRecord {
  const group = expense.groupId ? state.groups.find((item) => item.id === expense.groupId) : undefined;
  return {
    entityType: "expense",
    id: expense.id,
    title: expense.description,
    subtitle: `${group?.name ?? "Ungrouped"} | paid by ${contactName(state, expense.paidByContactId)}`,
    amountCents: expense.amountCents,
    currency: expense.currency,
    createdAt: expense.createdAt,
  };
}

function settlementRecord(state: LocalAppState, settlement: Settlement): NavigableRecord {
  return {
    entityType: "settlement",
    id: settlement.id,
    title: `${contactName(state, settlement.fromContactId)} paid ${contactName(state, settlement.toContactId)}`,
    subtitle: settlement.paymentType,
    amountCents: settlement.amountCents,
    currency: settlement.currency,
    createdAt: settlement.createdAt,
  };
}

function activityRecord(log: AiActionLog): NavigableRecord {
  return {
    entityType: "activity_log",
    id: log.id,
    title: log.parsedActionType,
    subtitle: `${log.executionStatus} | ${log.parserName}`,
    createdAt: log.createdAt,
  };
}

function findContactByName(state: LocalAppState, name: string) {
  const normalized = normalize(name);
  return state.contacts.find(
    (contact) =>
      normalize(contact.displayName) === normalized ||
      contact.aliases.some((alias) => normalize(alias) === normalized),
  );
}

function findGroupByName(state: LocalAppState, name: string) {
  const normalized = normalize(name);
  return state.groups.find((group) => normalize(group.name) === normalized);
}

function contactName(state: LocalAppState, contactId: string): string {
  return state.contacts.find((contact) => contact.id === contactId)?.displayName ?? "Unknown";
}

function matchText(query: string, values: Array<string | undefined>): boolean {
  return values.some((value) => value && normalize(value).includes(query));
}

function inRange(value: string, range: DateRange): boolean {
  if (range.startDate && value < range.startDate) return false;
  if (range.endDate && value > range.endDate) return false;
  return true;
}

function normalize(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "me" ? "you" : normalized;
}

function isRecord(value: NavigableRecord | undefined): value is NavigableRecord {
  return Boolean(value);
}
