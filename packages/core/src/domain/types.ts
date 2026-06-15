export type CurrencyCode = "USD" | "INR";

export type PaymentType = "cash" | "card" | "upi" | "venmo" | "unknown";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "groceries"
  | "travel"
  | "housing"
  | "utilities"
  | "other";

export type Contact = {
  id: string;
  displayName: string;
  normalizedDisplayName: string;
  email?: string;
  phone?: string;
  aliases: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  memberIds: string[];
  defaultCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSplit = {
  contactId: string;
  amountCents: number;
};

export type Expense = {
  id: string;
  groupId?: string;
  description: string;
  amountCents: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  paymentType: PaymentType;
  paidByContactId: string;
  splitWithContactIds: string[];
  splits: ExpenseSplit[];
  source: "manual" | "assistant" | "import";
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Settlement = {
  id: string;
  fromContactId: string;
  toContactId: string;
  amountCents: number;
  currency: CurrencyCode;
  paymentType: PaymentType;
  createdAt: string;
};

export type AiActionLog = {
  id: string;
  transcript: string;
  parserName: string;
  parsedActionType: string;
  validationStatus: "valid" | "invalid";
  executionStatus: "proposed" | "confirmed" | "completed" | "failed" | "cancelled";
  contextSizeChars: number;
  latencyMs: number;
  fallbackUsed: boolean;
  createdAt: string;
};

export type LocalAppState = {
  schemaVersion: 1;
  currentUserContactId: string;
  contacts: Contact[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  aiActionLogs: AiActionLog[];
  updatedAt: string;
};

export type Balance = {
  contactId: string;
  amountCents: number;
  currency: CurrencyCode;
};
