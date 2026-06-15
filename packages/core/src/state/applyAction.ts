import { parseAppAction, type AppAction } from "../actions/schemas";
import { splitEqually } from "../domain/money";
import type { Contact, Expense, Group, LocalAppState, Settlement } from "../domain/types";

export type ApplyActionResult = {
  state: LocalAppState;
  message: string;
};

export function applyConfirmedAction(
  state: LocalAppState,
  action: AppAction,
  now = new Date().toISOString(),
): ApplyActionResult {
  switch (action.type) {
    case "CREATE_CONTACT":
      return addContact(state, action.displayName, now, action.email, action.phone);
    case "CREATE_GROUP":
      return createGroup(state, action, now);
    case "ADD_EXPENSE":
      return addExpense(state, action, now);
    case "SETTLE_UP":
      return settleUp(state, action, now);
    case "DRAFT_EXPENSE_PLAN":
      return applyDraftExpensePlan(state, action, now);
    case "QUERY_BALANCE":
    case "QUERY_FINANCIAL_SUMMARY":
    case "SEARCH_RECORDS":
    case "OPEN_RECORD":
    case "SHOW_SEARCH_RESULTS":
    case "CLARIFICATION_REQUIRED":
    case "UNSUPPORTED_REQUEST":
      return {
        state,
        message: "No local data changed.",
      };
  }
}

function applyDraftExpensePlan(
  state: LocalAppState,
  action: Extract<AppAction, { type: "DRAFT_EXPENSE_PLAN" }>,
  now: string,
): ApplyActionResult {
  let nextState = state;
  const messages: string[] = [];

  action.operations.forEach((operation, index) => {
    const childAction = actionFromDraftOperation(action, operation, index, now);
    const result = applyConfirmedAction(nextState, childAction, now);
    nextState = result.state;
    messages.push(result.message);
  });

  return {
    state: touch(nextState, now),
    message: action.summary ?? messages.join(" "),
  };
}

function actionFromDraftOperation(
  action: Extract<AppAction, { type: "DRAFT_EXPENSE_PLAN" }>,
  operation: Extract<AppAction, { type: "DRAFT_EXPENSE_PLAN" }>["operations"][number],
  index: number,
  now: string,
): AppAction {
  const common = {
    id: `${action.id}_${index + 1}`,
    transcript: action.transcript,
    confidence: action.confidence,
  };

  switch (operation.type) {
    case "create_group":
      return parseAppAction({
        ...common,
        type: "CREATE_GROUP",
        groupName: operation.groupName,
        memberNames: operation.memberNames,
        currency: operation.currency,
      });
    case "create_contact":
      return parseAppAction({
        ...common,
        type: "CREATE_CONTACT",
        displayName: operation.displayName,
        email: operation.email,
        phone: operation.phone,
      });
    case "add_expense":
      return parseAppAction({
        ...common,
        type: "ADD_EXPENSE",
        groupName: operation.groupName,
        description: operation.description,
        amountCents: operation.amountCents,
        currency: operation.currency,
        paidByName: operation.paidByName,
        participantNames: operation.participantNames,
        splitType: operation.splitType,
        category: operation.category,
        paymentType: operation.paymentType,
        expenseDate: operation.expenseDate,
      });
    case "settle_up":
      return parseAppAction({
        ...common,
        type: "SETTLE_UP",
        fromName: operation.fromName,
        toName: operation.toName,
        amountCents: operation.amountCents,
        currency: operation.currency,
        paymentType: operation.paymentType,
        settlementDate: operation.settlementDate,
      });
  }
}

function addContact(
  state: LocalAppState,
  displayName: string,
  now: string,
  email?: string,
  phone?: string,
): ApplyActionResult {
  const existing = findContactByName(state.contacts, displayName);
  if (existing) {
    return {
      state,
      message: `${existing.displayName} already exists.`,
    };
  }

  const contact = createContact(displayName, now, email, phone);
  return {
    state: touch(
      {
        ...state,
        contacts: [...state.contacts, contact],
      },
      now,
    ),
    message: `Created contact ${contact.displayName}.`,
  };
}

function createGroup(
  state: LocalAppState,
  action: Extract<AppAction, { type: "CREATE_GROUP" }>,
  now: string,
): ApplyActionResult {
  const contactResult = ensureContacts(state, action.memberNames, now);
  const currentUserId = contactResult.state.currentUserContactId;
  const memberIds = unique([
    currentUserId,
    ...action.memberNames.map((name) => requireContactId(contactResult.state.contacts, name)),
  ]);

  const group: Group = {
    id: createId("group", action.groupName, now),
    name: action.groupName,
    memberIds,
    defaultCurrency: action.currency,
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: touch(
      {
        ...contactResult.state,
        groups: [...contactResult.state.groups, group],
      },
      now,
    ),
    message: `Created group ${group.name}.`,
  };
}

function addExpense(
  state: LocalAppState,
  action: Extract<AppAction, { type: "ADD_EXPENSE" }>,
  now: string,
): ApplyActionResult {
  const contactResult = ensureContacts(state, [action.paidByName, ...action.participantNames], now);
  const paidByContactId = requireContactId(contactResult.state.contacts, action.paidByName);
  const splitWithContactIds = unique(
    action.participantNames.map((name) => requireContactId(contactResult.state.contacts, name)),
  );
  const group = action.groupName
    ? findGroupByName(contactResult.state.groups, action.groupName)
    : contactResult.state.groups[0];

  const expense: Expense = {
    id: createId("expense", action.description, now),
    groupId: group?.id,
    description: action.description,
    amountCents: action.amountCents,
    currency: action.currency,
    category: action.category,
    paymentType: action.paymentType,
    paidByContactId,
    splitWithContactIds,
    splits: splitEqually(action.amountCents, splitWithContactIds),
    source: "assistant",
    expenseDate: action.expenseDate ?? now,
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: touch(
      {
        ...contactResult.state,
        expenses: [expense, ...contactResult.state.expenses],
      },
      now,
    ),
    message: `Added ${action.description}.`,
  };
}

function settleUp(
  state: LocalAppState,
  action: Extract<AppAction, { type: "SETTLE_UP" }>,
  now: string,
): ApplyActionResult {
  const contactResult = ensureContacts(state, [action.fromName, action.toName], now);
  const settlement: Settlement = {
    id: createId("settlement", `${action.fromName}_${action.toName}`, now),
    fromContactId: requireContactId(contactResult.state.contacts, action.fromName),
    toContactId: requireContactId(contactResult.state.contacts, action.toName),
    amountCents: action.amountCents,
    currency: action.currency,
    paymentType: action.paymentType,
    createdAt: action.settlementDate ?? now,
  };

  return {
    state: touch(
      {
        ...contactResult.state,
        settlements: [settlement, ...contactResult.state.settlements],
      },
      now,
    ),
    message: "Recorded settlement.",
  };
}

function ensureContacts(state: LocalAppState, names: string[], now: string): ApplyActionResult {
  let nextState = state;

  for (const name of names) {
    const normalized = normalizeName(name);
    if (normalized === "you" || findContactByName(nextState.contacts, name)) continue;

    const contact = createContact(name, now);
    nextState = {
      ...nextState,
      contacts: [...nextState.contacts, contact],
    };
  }

  return {
    state: nextState,
    message: "Resolved contacts.",
  };
}

function createContact(displayName: string, now: string, email?: string, phone?: string): Contact {
  const cleanName = displayName.trim();

  return {
    id: createId("contact", cleanName, now),
    displayName: cleanName,
    normalizedDisplayName: normalizeName(cleanName),
    email,
    phone,
    aliases: [],
    createdAt: now,
    updatedAt: now,
  };
}

function requireContactId(contacts: Contact[], displayName: string): string {
  const normalized = normalizeName(displayName);
  const contact =
    normalized === "me"
      ? contacts.find((item) => item.id === "contact_you")
      : findContactByName(contacts, displayName);

  if (!contact) {
    throw new Error(`Contact not found: ${displayName}`);
  }

  return contact.id;
}

function findContactByName(contacts: Contact[], displayName: string): Contact | undefined {
  const normalized = normalizeName(displayName);

  return contacts.find(
    (contact) =>
      contact.normalizedDisplayName === normalized ||
      contact.aliases.some((alias) => normalizeName(alias) === normalized),
  );
}

function findGroupByName(groups: Group[], name: string): Group | undefined {
  const normalized = normalizeName(name);
  return groups.find((group) => normalizeName(group.name) === normalized);
}

function touch(state: LocalAppState, now: string): LocalAppState {
  return {
    ...state,
    updatedAt: now,
  };
}

function createId(prefix: string, value: string, now: string): string {
  return `${prefix}_${normalizeName(value).replace(/[^a-z0-9]+/g, "_")}_${now.replace(/[^0-9]/g, "")}`;
}

function normalizeName(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "me" ? "you" : normalized;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
