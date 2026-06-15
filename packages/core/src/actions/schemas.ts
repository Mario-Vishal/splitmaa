import { z } from "zod";

export const currencySchema = z.enum(["USD", "INR"]);
export const paymentTypeSchema = z.enum(["cash", "card", "upi", "venmo", "unknown"]);
export const categorySchema = z.enum([
  "food",
  "transport",
  "groceries",
  "travel",
  "housing",
  "utilities",
  "other",
]);

const baseActionSchema = z.object({
  id: z.string().min(1),
  transcript: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const entityTypeSchema = z.enum(["contact", "group", "expense", "settlement", "activity_log"]);

export const createGroupActionSchema = baseActionSchema.extend({
  type: z.literal("CREATE_GROUP"),
  groupName: z.string().min(1),
  memberNames: z.array(z.string().min(1)).min(1),
  currency: currencySchema.default("USD"),
});

export const createContactActionSchema = baseActionSchema.extend({
  type: z.literal("CREATE_CONTACT"),
  displayName: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
});

export const addExpenseActionSchema = baseActionSchema.extend({
  type: z.literal("ADD_EXPENSE"),
  groupName: z.string().optional(),
  description: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: currencySchema,
  paidByName: z.string().min(1),
  participantNames: z.array(z.string().min(1)).min(1),
  splitType: z.literal("equal"),
  category: categorySchema.default("other"),
  paymentType: paymentTypeSchema.default("unknown"),
  expenseDate: z.string().optional(),
});

export const settleUpActionSchema = baseActionSchema.extend({
  type: z.literal("SETTLE_UP"),
  fromName: z.string().min(1),
  toName: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: currencySchema,
  paymentType: paymentTypeSchema.default("unknown"),
  settlementDate: z.string().optional(),
});

export const queryBalanceActionSchema = baseActionSchema.extend({
  type: z.literal("QUERY_BALANCE"),
  personName: z.string().min(1).optional(),
  currency: currencySchema.default("USD"),
  dateRange: dateRangeSchema.optional(),
});

export const queryFinancialSummaryActionSchema = baseActionSchema.extend({
  type: z.literal("QUERY_FINANCIAL_SUMMARY"),
  summaryType: z.enum([
    "total_owed_to_me",
    "total_i_owe",
    "net_balance",
    "total_spent",
    "person_balance",
    "group_total",
  ]),
  personName: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  currency: currencySchema.default("USD"),
  dateRange: dateRangeSchema.optional(),
});

export const searchRecordsActionSchema = baseActionSchema.extend({
  type: z.literal("SEARCH_RECORDS"),
  query: z.string().min(1),
  entityTypes: z.array(entityTypeSchema).min(1),
  personName: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  currency: currencySchema.optional(),
  category: categorySchema.optional(),
  dateRange: dateRangeSchema.optional(),
  limit: z.number().int().positive().max(50).default(10),
});

export const openRecordActionSchema = baseActionSchema.extend({
  type: z.literal("OPEN_RECORD"),
  entityType: entityTypeSchema,
  recordId: z.string().min(1).optional(),
  searchQuery: z.string().min(1).optional(),
  highlightRecordId: z.string().min(1).optional(),
});

export const showSearchResultsActionSchema = baseActionSchema.extend({
  type: z.literal("SHOW_SEARCH_RESULTS"),
  resultSetId: z.string().min(1),
  highlightRecordId: z.string().min(1).optional(),
});

export const clarificationRequiredActionSchema = baseActionSchema.extend({
  type: z.literal("CLARIFICATION_REQUIRED"),
  question: z.string().min(1),
  missingFields: z.array(z.string().min(1)),
});

export const unsupportedRequestActionSchema = baseActionSchema.extend({
  type: z.literal("UNSUPPORTED_REQUEST"),
  reason: z.string().min(1),
});

export const appActionSchema = z.discriminatedUnion("type", [
  createGroupActionSchema,
  createContactActionSchema,
  addExpenseActionSchema,
  settleUpActionSchema,
  queryBalanceActionSchema,
  queryFinancialSummaryActionSchema,
  searchRecordsActionSchema,
  openRecordActionSchema,
  showSearchResultsActionSchema,
  clarificationRequiredActionSchema,
  unsupportedRequestActionSchema,
]);

export type AppAction = z.infer<typeof appActionSchema>;

export function parseAppAction(value: unknown): AppAction {
  return appActionSchema.parse(value);
}
