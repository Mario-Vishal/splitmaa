import { z } from "zod";
import {
  addExpenseActionSchema,
  createContactActionSchema,
  createGroupActionSchema,
  parseAppAction,
  queryBalanceActionSchema,
  settleUpActionSchema,
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
export const queryBalanceToolArgsSchema = queryBalanceActionSchema.omit(baseActionFields);

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
    name: z.literal("query_balance"),
    arguments: queryBalanceToolArgsSchema,
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
        currency: { type: "string", enum: ["USD", "INR", "EUR", "GBP"], default: "USD" },
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
        currency: { type: "string", enum: ["USD", "INR", "EUR", "GBP"] },
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
        currency: { type: "string", enum: ["USD", "INR", "EUR", "GBP"] },
        paymentType: {
          type: "string",
          enum: ["cash", "card", "upi", "venmo", "unknown"],
          default: "unknown",
        },
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
        currency: { type: "string", enum: ["USD", "INR", "EUR", "GBP"], default: "USD" },
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
    case "query_balance":
      return parseAppAction({ ...common, type: "QUERY_BALANCE", ...call.arguments });
  }
}

function createActionId(toolName: ModelToolName, now: string): string {
  return `tool_${toolName}_${now.replace(/[^0-9]/g, "")}`;
}
