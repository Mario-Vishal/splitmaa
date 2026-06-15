import { z } from "zod";
import {
  parseWorkflowIntent,
  workflowIntentToAppAction,
  workflowIntentSchema,
  type WorkflowIntent,
} from "../workflow/intent";
import type { AppAction } from "../actions/schemas";

export const extractWorkflowIntentToolArgsSchema = workflowIntentSchema;

export const modelToolCallSchema = z
  .object({
    name: z.literal("extract_workflow_intent"),
    arguments: extractWorkflowIntentToolArgsSchema,
  })
  .strict();

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
    name: "extract_workflow_intent",
    description:
      "Extract one strict Splitmaa workflow intent. The app owns SQLite lookup, trusted IDs, UI clarification, confirmation, money/date normalization, persistence, navigation, and audit.",
    mutatesState: false,
    requiresConfirmation: false,
    parameters: {
      type: "object",
      required: ["schemaVersion", "workflowType", "confidence", "operations", "missingFields", "ambiguities"],
      additionalProperties: false,
      properties: {
        schemaVersion: { type: "string", const: "1.0" },
        workflowVersion: { type: "string", default: "1.0" },
        modelVersion: { type: "string" },
        clientVersion: { type: "string" },
        workflowType: {
          type: "string",
          enum: [
            "entity_mutation",
            "expense_mutation",
            "multi_step",
            "record_lookup",
            "financial_answer",
            "clarification_response",
            "unsupported",
          ],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        locale: { type: "string", default: "en-US" },
        currencyHint: { type: "string", enum: ["USD", "INR"] },
        pendingWorkflowRef: referenceParameter(),
        pendingEventType: { type: "string" },
        operations: {
          type: "array",
          maxItems: 10,
          items: {
            oneOf: [
              createContactOperationParameter(),
              createGroupOperationParameter(),
              groupMemberOperationParameter("add_group_member"),
              groupMemberOperationParameter("remove_group_member"),
              addExpenseOperationParameter(),
              recordRefOperationParameter("edit_expense", "expenseRef"),
              recordRefOperationParameter("delete_expense", "expenseRef"),
              settleUpOperationParameter(),
              changeSplitOperationParameter(),
              searchRecordsOperationParameter(),
              openRecordOperationParameter(),
              listRecordsOperationParameter(),
              showPreviousOperationParameter(),
              getRecordMetadataOperationParameter(),
              computeOperationParameter("compute_balance"),
              computeOperationParameter("compute_total"),
              computeOperationParameter("compute_summary"),
              computeOperationParameter("compute_date_window_total"),
              clarificationOperationParameter("select_option"),
              clarificationOperationParameter("provide_contact_details"),
              clarificationOperationParameter("provide_missing_field"),
              clarificationOperationParameter("cancel_pending_workflow"),
            ],
          },
        },
        missingFields: {
          type: "array",
          items: { type: "string", minLength: 1 },
        },
        ambiguities: {
          type: "array",
          items: { type: "string", minLength: 1 },
        },
      },
    },
  },
];

export function parseModelToolCall(value: unknown): ModelToolCall {
  return modelToolCallSchema.parse(value);
}

export function parseExtractedWorkflowIntent(value: unknown): WorkflowIntent {
  return parseWorkflowIntent(value);
}

export function appActionFromModelToolCall(call: ModelToolCall, context: ModelToolActionContext): AppAction {
  return workflowIntentToAppAction(call.arguments, context);
}

function referenceParameter(): Record<string, unknown> {
  return {
    oneOf: [
      { type: "object", required: ["refType"], additionalProperties: false, properties: { refType: { type: "string", const: "current_user" } } },
      {
        type: "object",
        required: ["refType", "value"],
        additionalProperties: false,
        properties: { refType: { type: "string", const: "name" }, value: { type: "string", minLength: 1 } },
      },
      {
        type: "object",
        required: ["refType", "entityType", "id"],
        additionalProperties: false,
        properties: {
          refType: { type: "string", const: "record_ref" },
          entityType: entityTypeParameter(),
          id: { type: "string", minLength: 1 },
        },
      },
      { type: "object", required: ["refType"], additionalProperties: false, properties: { refType: { type: "string", const: "last_result" } } },
      {
        type: "object",
        required: ["refType"],
        additionalProperties: false,
        properties: { refType: { type: "string", const: "active_pending_workflow" } },
      },
    ],
  };
}

function createContactOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "create_contact" },
      args: {
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
  };
}

function createGroupOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "create_group" },
      args: {
        type: "object",
        required: ["groupName", "members"],
        additionalProperties: false,
        properties: {
          groupName: { type: "string", minLength: 1 },
          members: { type: "array", minItems: 1, maxItems: 16, items: referenceParameter() },
          currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
        },
      },
    },
  };
}

function groupMemberOperationParameter(operationType: string): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: operationType },
      args: {
        type: "object",
        required: ["groupRef", "member"],
        additionalProperties: false,
        properties: { groupRef: referenceParameter(), member: referenceParameter() },
      },
    },
  };
}

function addExpenseOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "add_expense" },
      args: {
        type: "object",
        required: ["description", "amountText", "currency", "paidBy", "split"],
        additionalProperties: false,
        properties: {
          description: { type: "string", minLength: 1 },
          amountText: { type: "string", minLength: 1 },
          currency: { type: "string", enum: ["USD", "INR"] },
          groupRef: referenceParameter(),
          paidBy: referenceParameter(),
          split: splitParameter(),
          category: { type: "string", enum: ["food", "transport", "groceries", "travel", "housing", "utilities", "other"], default: "other" },
          paymentType: { type: "string", enum: ["cash", "card", "upi", "venmo", "unknown"], default: "unknown" },
          date: dateRangeParameter(),
        },
      },
    },
  };
}

function recordRefOperationParameter(operationType: string, refKey: string): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: operationType },
      args: {
        type: "object",
        required: [refKey],
        additionalProperties: false,
        properties: { [refKey]: referenceParameter() },
      },
    },
  };
}

function settleUpOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "settle_up" },
      args: {
        type: "object",
        required: ["from", "to", "amountText", "currency"],
        additionalProperties: false,
        properties: {
          from: referenceParameter(),
          to: referenceParameter(),
          amountText: { type: "string", minLength: 1 },
          currency: { type: "string", enum: ["USD", "INR"] },
          paymentType: { type: "string", enum: ["cash", "card", "upi", "venmo", "unknown"], default: "unknown" },
          date: dateRangeParameter(),
        },
      },
    },
  };
}

function changeSplitOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "change_split" },
      args: {
        type: "object",
        required: ["expenseRef", "split"],
        additionalProperties: false,
        properties: { expenseRef: referenceParameter(), split: splitParameter() },
      },
    },
  };
}

function searchRecordsOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "search_records" },
      args: {
        type: "object",
        required: ["query", "entityTypes"],
        additionalProperties: false,
        properties: {
          query: { type: "string", minLength: 1 },
          entityTypes: { type: "array", minItems: 1, items: entityTypeParameter() },
          personRef: referenceParameter(),
          groupRef: referenceParameter(),
          currency: { type: "string", enum: ["USD", "INR"] },
          category: { type: "string", enum: ["food", "transport", "groceries", "travel", "housing", "utilities", "other"] },
          dateRange: dateRangeParameter(),
          limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        },
      },
    },
  };
}

function openRecordOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "open_record" },
      args: {
        type: "object",
        required: ["entityType"],
        additionalProperties: false,
        properties: {
          entityType: entityTypeParameter(),
          recordRef: referenceParameter(),
          searchQuery: { type: "string", minLength: 1 },
          highlightRef: referenceParameter(),
        },
      },
    },
  };
}

function listRecordsOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "list_records" },
      args: {
        type: "object",
        required: ["entityType"],
        additionalProperties: false,
        properties: {
          entityType: entityTypeParameter(),
          groupRef: referenceParameter(),
          limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
      },
    },
  };
}

function showPreviousOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "show_previous" },
      args: {
        type: "object",
        additionalProperties: false,
        properties: { target: { type: "string", enum: ["last_result_set", "last_record", "active_pending_workflow"], default: "last_result_set" } },
      },
    },
  };
}

function getRecordMetadataOperationParameter(): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: "get_record_metadata" },
      args: {
        type: "object",
        additionalProperties: false,
        properties: {
          entityType: entityTypeParameter(),
          recordRef: referenceParameter(),
          query: { type: "string", minLength: 1 },
        },
      },
    },
  };
}

function computeOperationParameter(operationType: string): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: operationType },
      args: {
        type: "object",
        additionalProperties: false,
        properties: {
          metric: { type: "string", enum: ["total_owed_to_me", "total_i_owe", "net_balance", "total_spent", "person_balance", "group_total"] },
          personRef: referenceParameter(),
          groupRef: referenceParameter(),
          currency: { type: "string", enum: ["USD", "INR"], default: "USD" },
          dateRange: dateRangeParameter(),
        },
      },
    },
  };
}

function clarificationOperationParameter(operationType: string): Record<string, unknown> {
  return {
    type: "object",
    required: ["operationType", "args"],
    additionalProperties: false,
    properties: {
      operationType: { type: "string", const: operationType },
      args: {
        type: "object",
        additionalProperties: false,
        properties: {
          selection: selectionParameter(),
          displayName: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          fieldName: { type: "string", minLength: 1 },
          valueText: { type: "string", minLength: 1 },
        },
      },
    },
  };
}

function splitParameter(): Record<string, unknown> {
  return {
    oneOf: [
      {
        type: "object",
        required: ["splitType", "participants"],
        additionalProperties: false,
        properties: {
          splitType: { type: "string", const: "equal" },
          participants: { type: "array", minItems: 1, maxItems: 16, items: referenceParameter() },
        },
      },
      {
        type: "object",
        required: ["splitType", "participant"],
        additionalProperties: false,
        properties: {
          splitType: { type: "string", const: "full_amount" },
          participant: referenceParameter(),
        },
      },
    ],
  };
}

function selectionParameter(): Record<string, unknown> {
  return {
    oneOf: [
      {
        type: "object",
        required: ["selectionType", "ordinal", "rawText"],
        additionalProperties: false,
        properties: {
          selectionType: { type: "string", const: "ordinal" },
          ordinal: { type: "integer", minimum: 1 },
          rawText: { type: "string", minLength: 1 },
        },
      },
      {
        type: "object",
        required: ["selectionType", "label"],
        additionalProperties: false,
        properties: {
          selectionType: { type: "string", const: "label" },
          label: { type: "string", minLength: 1 },
          rawText: { type: "string", minLength: 1 },
        },
      },
      {
        type: "object",
        required: ["selectionType"],
        additionalProperties: false,
        properties: {
          selectionType: { type: "string", const: "cancel" },
          rawText: { type: "string", minLength: 1 },
        },
      },
    ],
  };
}

function dateRangeParameter(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      dateText: { type: "string", minLength: 1 },
      dateIntent: {
        type: "string",
        enum: [
          "today",
          "yesterday",
          "current_calendar_month",
          "previous_calendar_month",
          "current_calendar_year",
          "previous_calendar_year",
          "explicit_range",
          "unspecified",
        ],
        default: "unspecified",
      },
      startDate: { type: "string" },
      endDate: { type: "string" },
    },
  };
}

function entityTypeParameter(): Record<string, unknown> {
  return {
    type: "string",
    enum: ["contact", "group", "expense", "settlement", "activity_log"],
  };
}
