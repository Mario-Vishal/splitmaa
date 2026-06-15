import { z } from "zod";
import {
  addExpenseActionSchema,
  createContactActionSchema,
  createGroupActionSchema,
  draftExpensePlanActionSchema,
  openRecordActionSchema,
  parseAppAction,
  queryFinancialSummaryActionSchema,
  queryBalanceActionSchema,
  searchRecordsActionSchema,
  settleUpActionSchema,
  showSearchResultsActionSchema,
  type AppAction,
} from "../actions/schemas";

const baseActionFields = {
  id: true,
  transcript: true,
  confidence: true,
  type: true,
} as const;

export const createGroupToolArgsSchema = createGroupActionSchema.omit(baseActionFields);
export const createContactToolArgsSchema = createContactActionSchema.omit(baseActionFields);
export const addExpenseToolArgsSchema = addExpenseActionSchema.omit(baseActionFields);
export const settleUpToolArgsSchema = settleUpActionSchema.omit(baseActionFields);
export const draftExpensePlanToolArgsSchema = draftExpensePlanActionSchema.omit(baseActionFields);
export const queryBalanceToolArgsSchema = queryBalanceActionSchema.omit(baseActionFields);
export const queryFinancialSummaryToolArgsSchema = queryFinancialSummaryActionSchema.omit(baseActionFields);
export const searchRecordsToolArgsSchema = searchRecordsActionSchema.omit(baseActionFields);
export const openRecordToolArgsSchema = openRecordActionSchema.omit(baseActionFields);
export const showSearchResultsToolArgsSchema = showSearchResultsActionSchema.omit(baseActionFields);

export const modelToolCallSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("create_group"),
    arguments: createGroupToolArgsSchema,
  }),
  z.object({
    name: z.literal("create_contact"),
    arguments: createContactToolArgsSchema,
  }),
  z.object({
    name: z.literal("add_expense"),
    arguments: addExpenseToolArgsSchema,
  }),
  z.object({
    name: z.literal("settle_up"),
    arguments: settleUpToolArgsSchema,
  }),
  z.object({
    name: z.literal("draft_expense_plan"),
    arguments: draftExpensePlanToolArgsSchema,
  }),
  z.object({
    name: z.literal("query_balance"),
    arguments: queryBalanceToolArgsSchema,
  }),
  z.object({
    name: z.literal("query_financial_summary"),
    arguments: queryFinancialSummaryToolArgsSchema,
  }),
  z.object({
    name: z.literal("search_records"),
    arguments: searchRecordsToolArgsSchema,
  }),
  z.object({
    name: z.literal("open_record"),
    arguments: openRecordToolArgsSchema,
  }),
  z.object({
    name: z.literal("show_search_results"),
    arguments: showSearchResultsToolArgsSchema,
  }),
  z.object({
    name: z.literal("clarification_required"),
    arguments: z.object({
      question: z.string().min(1),
      missingFields: z.array(z.string().min(1)),
    }),
  }),
  z.object({
    name: z.literal("unsupported_request"),
    arguments: z.object({
      reason: z.string().min(1),
    }),
  }),
]);

export type ModelToolCall = z.infer<typeof modelToolCallSchema>;
export type ModelToolName = ModelToolCall["name"];

export type ModelToolDefinition = {
  name: ModelToolName;
  description: string;
  mutatesState: boolean;
  requiresConfirmation: boolean;
  parameters: {
    type: "object";
    required: string[];
    properties: Record<string, unknown>;
    additionalProperties: false;
  };
};

export type ModelToolActionContext = {
  transcript: string;
  now: string;
  confidence?: number;
};

export const modelToolDefinitions: ModelToolDefinition[] = [
  {
    name: "create_group",
    description: "Create an expense group and ensure the named members exist as contacts.",
    mutatesState: true,
    requiresConfirmation: true,
    parameters: {
      type: "object",
      required: ["groupName", "memberNames"],
      additionalProperties: false,
      properties: {
        groupName: { type: "string", minLength: 1 },
        memberNames: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 },
        },
        currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
      },
    },
  },
  {
    name: "create_contact",
    description: "Create a contact profile for a person mentioned by the user.",
    mutatesState: true,
    requiresConfirmation: true,
    parameters: {
      type: "object",
      required: ["displayName"],
      additionalProperties: false,
      properties: {
        displayName: { type: "string", minLength: 1 },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
      },
    },
  },
  {
    name: "add_expense",
    description: "Record an equal-split expense paid by one person and shared by participants.",
    mutatesState: true,
    requiresConfirmation: true,
    parameters: {
      type: "object",
      required: ["description", "amountCents", "currency", "paidByName", "participantNames", "splitType"],
      additionalProperties: false,
      properties: {
        groupName: { type: "string" },
        description: { type: "string", minLength: 1 },
        amountCents: { type: "integer", minimum: 1 },
        currency: { type: "string", enum: ["USD", "INR"] },
        paidByName: { type: "string", minLength: 1 },
        participantNames: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 },
        },
        splitType: { type: "string", const: "equal" },
        category: {
          type: "string",
          enum: ["food", "transport", "groceries", "travel", "housing", "utilities", "other"],
          default: "other",
        },
        paymentType: {
          type: "string",
          enum: ["cash", "card", "upi", "venmo", "unknown"],
          default: "unknown",
        },
        expenseDate: { type: "string", description: "ISO date/time if the user gives an expense date." },
      },
    },
  },
  {
    name: "settle_up",
    description: "Record a payment from one person to another to reduce an open balance.",
    mutatesState: true,
    requiresConfirmation: true,
    parameters: {
      type: "object",
      required: ["fromName", "toName", "amountCents", "currency"],
      additionalProperties: false,
      properties: {
        fromName: { type: "string", minLength: 1 },
        toName: { type: "string", minLength: 1 },
        amountCents: { type: "integer", minimum: 1 },
        currency: { type: "string", enum: ["USD", "INR"] },
        paymentType: {
          type: "string",
          enum: ["cash", "card", "upi", "venmo", "unknown"],
          default: "unknown",
        },
        settlementDate: { type: "string", description: "ISO date/time if the user gives a settlement date." },
      },
    },
  },
  {
    name: "draft_expense_plan",
    description:
      "Draft a confirmed multi-step plan for a complex Splitmaa command containing group/contact creation, expenses, or settlements. The app resolves contacts, asks clarification, confirms, and executes deterministically.",
    mutatesState: true,
    requiresConfirmation: true,
    parameters: {
      type: "object",
      required: ["operations"],
      additionalProperties: false,
      properties: {
        operations: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: {
            oneOf: [
              {
                type: "object",
                required: ["type", "groupName", "memberNames"],
                additionalProperties: false,
                properties: {
                  type: { type: "string", const: "create_group" },
                  groupName: { type: "string", minLength: 1 },
                  memberNames: {
                    type: "array",
                    minItems: 1,
                    maxItems: 8,
                    items: { type: "string", minLength: 1 },
                  },
                  currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
                },
              },
              {
                type: "object",
                required: ["type", "displayName"],
                additionalProperties: false,
                properties: {
                  type: { type: "string", const: "create_contact" },
                  displayName: { type: "string", minLength: 1 },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                },
              },
              {
                type: "object",
                required: ["type", "description", "amountCents", "currency", "paidByName", "participantNames", "splitType"],
                additionalProperties: false,
                properties: {
                  type: { type: "string", const: "add_expense" },
                  groupName: { type: "string" },
                  description: { type: "string", minLength: 1 },
                  amountCents: { type: "integer", minimum: 1 },
                  currency: { type: "string", enum: ["USD", "INR"] },
                  paidByName: { type: "string", minLength: 1 },
                  participantNames: {
                    type: "array",
                    minItems: 1,
                    maxItems: 8,
                    items: { type: "string", minLength: 1 },
                  },
                  splitType: { type: "string", const: "equal" },
                  category: {
                    type: "string",
                    enum: ["food", "transport", "groceries", "travel", "housing", "utilities", "other"],
                    default: "other",
                  },
                  paymentType: {
                    type: "string",
                    enum: ["cash", "card", "upi", "venmo", "unknown"],
                    default: "unknown",
                  },
                  expenseDate: { type: "string" },
                },
              },
              {
                type: "object",
                required: ["type", "fromName", "toName", "amountCents", "currency"],
                additionalProperties: false,
                properties: {
                  type: { type: "string", const: "settle_up" },
                  fromName: { type: "string", minLength: 1 },
                  toName: { type: "string", minLength: 1 },
                  amountCents: { type: "integer", minimum: 1 },
                  currency: { type: "string", enum: ["USD", "INR"] },
                  paymentType: {
                    type: "string",
                    enum: ["cash", "card", "upi", "venmo", "unknown"],
                    default: "unknown",
                  },
                  settlementDate: { type: "string" },
                },
              },
            ],
          },
        },
        summary: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "query_balance",
    description: "Read local balances without changing app data.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: [],
      additionalProperties: false,
      properties: {
        personName: { type: "string", minLength: 1 },
        currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
        dateRange: dateRangeParameter(),
      },
    },
  },
  {
    name: "query_financial_summary",
    description: "Read a grounded financial summary from local data without changing state.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["summaryType"],
      additionalProperties: false,
      properties: {
        summaryType: {
          type: "string",
          enum: [
            "total_owed_to_me",
            "total_i_owe",
            "net_balance",
            "total_spent",
            "person_balance",
            "group_total",
          ],
        },
        personName: { type: "string", minLength: 1 },
        groupName: { type: "string", minLength: 1 },
        currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
        dateRange: dateRangeParameter(),
      },
    },
  },
  {
    name: "search_records",
    description: "Search local contacts, groups, expenses, settlements, or activity logs.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["query", "entityTypes"],
      additionalProperties: false,
      properties: {
        query: { type: "string", minLength: 1 },
        entityTypes: entityTypesParameter(),
        personName: { type: "string", minLength: 1 },
        groupName: { type: "string", minLength: 1 },
        currency: { type: "string", enum: ["USD", "INR"] },
        category: {
          type: "string",
          enum: ["food", "transport", "groceries", "travel", "housing", "utilities", "other"],
        },
        dateRange: dateRangeParameter(),
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
    },
  },
  {
    name: "open_record",
    description: "Navigate to a local record and optionally highlight it.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["entityType"],
      additionalProperties: false,
      properties: {
        entityType: entityTypeParameter(),
        recordId: { type: "string", minLength: 1 },
        searchQuery: { type: "string", minLength: 1 },
        highlightRecordId: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "show_search_results",
    description: "Show a previously created search result set and optionally highlight one result.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["resultSetId"],
      additionalProperties: false,
      properties: {
        resultSetId: { type: "string", minLength: 1 },
        highlightRecordId: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "clarification_required",
    description: "Ask for missing information before choosing a mutation or query tool.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["question", "missingFields"],
      additionalProperties: false,
      properties: {
        question: { type: "string", minLength: 1 },
        missingFields: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 },
        },
      },
    },
  },
  {
    name: "unsupported_request",
    description: "Reject requests outside Splitmaa's local expense, search, navigation, and balance scope.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["reason"],
      additionalProperties: false,
      properties: {
        reason: { type: "string", minLength: 1 },
      },
    },
  },
];

export function parseModelToolCall(value: unknown): ModelToolCall {
  return modelToolCallSchema.parse(value);
}

export function appActionFromModelToolCall(call: ModelToolCall, context: ModelToolActionContext): AppAction {
  const common = {
    id: createActionId(call.name, context.now),
    transcript: context.transcript,
    confidence: context.confidence ?? 0.8,
  };

  switch (call.name) {
    case "create_group":
      return parseAppAction({ ...common, type: "CREATE_GROUP", ...call.arguments });
    case "create_contact":
      return parseAppAction({ ...common, type: "CREATE_CONTACT", ...call.arguments });
    case "add_expense":
      return parseAppAction({ ...common, type: "ADD_EXPENSE", ...call.arguments });
    case "settle_up":
      return parseAppAction({ ...common, type: "SETTLE_UP", ...call.arguments });
    case "draft_expense_plan":
      return parseAppAction({ ...common, type: "DRAFT_EXPENSE_PLAN", ...call.arguments });
    case "query_balance":
      return parseAppAction({ ...common, type: "QUERY_BALANCE", ...call.arguments });
    case "query_financial_summary":
      return parseAppAction({ ...common, type: "QUERY_FINANCIAL_SUMMARY", ...call.arguments });
    case "search_records":
      return parseAppAction({ ...common, type: "SEARCH_RECORDS", ...call.arguments });
    case "open_record":
      return parseAppAction({ ...common, type: "OPEN_RECORD", ...call.arguments });
    case "show_search_results":
      return parseAppAction({ ...common, type: "SHOW_SEARCH_RESULTS", ...call.arguments });
    case "clarification_required":
      return parseAppAction({ ...common, type: "CLARIFICATION_REQUIRED", ...call.arguments });
    case "unsupported_request":
      return parseAppAction({ ...common, type: "UNSUPPORTED_REQUEST", ...call.arguments });
  }
}

function createActionId(toolName: ModelToolName, now: string): string {
  return `tool_${toolName}_${now.replace(/[^0-9]/g, "")}`;
}

function dateRangeParameter() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      startDate: { type: "string" },
      endDate: { type: "string" },
    },
  };
}

function entityTypeParameter() {
  return {
    type: "string",
    enum: ["contact", "group", "expense", "settlement", "activity_log"],
  };
}

function entityTypesParameter() {
  return {
    type: "array",
    minItems: 1,
    items: entityTypeParameter(),
  };
}
