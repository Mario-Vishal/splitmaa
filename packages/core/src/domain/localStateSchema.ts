import { z } from "zod";
import type { LocalAppState } from "./types";

const currencySchema = z.enum(["USD", "INR"]);
const paymentTypeSchema = z.enum(["cash", "card", "upi", "venmo", "unknown"]);
const categorySchema = z.enum([
  "food",
  "transport",
  "groceries",
  "travel",
  "housing",
  "utilities",
  "other",
]);

const contactSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  normalizedDisplayName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  aliases: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberIds: z.array(z.string()),
  defaultCurrency: currencySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const expenseSplitSchema = z.object({
  contactId: z.string(),
  amountCents: z.number().int(),
});

const expenseSchema = z.object({
  id: z.string(),
  groupId: z.string().optional(),
  description: z.string(),
  amountCents: z.number().int().positive(),
  currency: currencySchema,
  category: categorySchema,
  paymentType: paymentTypeSchema,
  paidByContactId: z.string(),
  splitWithContactIds: z.array(z.string()),
  splits: z.array(expenseSplitSchema),
  source: z.enum(["manual", "assistant", "import"]),
  expenseDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const settlementSchema = z.object({
  id: z.string(),
  fromContactId: z.string(),
  toContactId: z.string(),
  amountCents: z.number().int().positive(),
  currency: currencySchema,
  paymentType: paymentTypeSchema,
  createdAt: z.string(),
});

const aiActionLogSchema = z.object({
  id: z.string(),
  transcript: z.string(),
  parserName: z.string(),
  parsedActionType: z.string(),
  validationStatus: z.enum(["valid", "invalid"]),
  executionStatus: z.enum(["proposed", "confirmed", "completed", "failed", "cancelled"]),
  contextSizeChars: z.number().int().nonnegative(),
  latencyMs: z.number().nonnegative(),
  fallbackUsed: z.boolean(),
  createdAt: z.string(),
});

export const localAppStateSchema = z.object({
  schemaVersion: z.literal(1),
  currentUserContactId: z.string(),
  contacts: z.array(contactSchema),
  groups: z.array(groupSchema),
  expenses: z.array(expenseSchema),
  settlements: z.array(settlementSchema),
  aiActionLogs: z.array(aiActionLogSchema),
  updatedAt: z.string(),
});

export function validateLocalAppState(value: unknown): LocalAppState {
  return localAppStateSchema.parse(value);
}
