import { z } from "zod";
import { parseAppAction, type AppAction } from "../actions/schemas";
import { normalizeAmountText } from "../domain/money";

const schemaVersionSchema = z.literal("1.0");
const workflowTypeSchema = z.enum([
  "entity_mutation",
  "expense_mutation",
  "multi_step",
  "record_lookup",
  "financial_answer",
  "clarification_response",
  "unsupported",
]);
const currencySchema = z.enum(["USD", "INR"]);
const entityTypeSchema = z.enum(["contact", "group", "expense", "settlement", "activity_log"]);
const dateIntentSchema = z.enum([
  "today",
  "yesterday",
  "current_calendar_month",
  "previous_calendar_month",
  "current_calendar_year",
  "previous_calendar_year",
  "explicit_range",
  "unspecified",
]);

const referenceSchema = z.discriminatedUnion("refType", [
  z.object({ refType: z.literal("current_user") }).strict(),
  z.object({ refType: z.literal("name"), value: z.string().min(1) }).strict(),
  z.object({ refType: z.literal("record_ref"), entityType: entityTypeSchema, id: z.string().min(1) }).strict(),
  z.object({ refType: z.literal("last_result") }).strict(),
  z.object({ refType: z.literal("active_pending_workflow") }).strict(),
]);

const dateRangeSchema = z
  .object({
    dateText: z.string().min(1).optional(),
    dateIntent: dateIntentSchema.default("unspecified"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

const splitSchema = z.discriminatedUnion("splitType", [
  z
    .object({
      splitType: z.literal("equal"),
      participants: z.array(referenceSchema).min(1).max(16),
    })
    .strict(),
  z
    .object({
      splitType: z.literal("full_amount"),
      participant: referenceSchema,
    })
    .strict(),
]);

const selectionSchema = z.discriminatedUnion("selectionType", [
  z.object({ selectionType: z.literal("ordinal"), ordinal: z.number().int().positive(), rawText: z.string().min(1) }).strict(),
  z.object({ selectionType: z.literal("label"), label: z.string().min(1), rawText: z.string().min(1).optional() }).strict(),
  z.object({ selectionType: z.literal("cancel"), rawText: z.string().min(1).optional() }).strict(),
]);

const createContactOperationSchema = z
  .object({
    operationType: z.literal("create_contact"),
    args: z
      .object({
        displayName: z.string().min(1),
        email: z.email().optional(),
        phone: z.string().optional(),
      })
      .strict(),
  })
  .strict();

const createGroupOperationSchema = z
  .object({
    operationType: z.literal("create_group"),
    args: z
      .object({
        groupName: z.string().min(1),
        members: z.array(referenceSchema).min(1).max(16),
        currency: currencySchema.default("USD"),
      })
      .strict(),
  })
  .strict();

const addGroupMemberOperationSchema = z
  .object({
    operationType: z.literal("add_group_member"),
    args: z.object({ groupRef: referenceSchema, member: referenceSchema }).strict(),
  })
  .strict();

const removeGroupMemberOperationSchema = z
  .object({
    operationType: z.literal("remove_group_member"),
    args: z.object({ groupRef: referenceSchema, member: referenceSchema }).strict(),
  })
  .strict();

const addExpenseOperationSchema = z
  .object({
    operationType: z.literal("add_expense"),
    args: z
      .object({
        description: z.string().min(1),
        amountText: z.string().min(1),
        currency: currencySchema,
        groupRef: referenceSchema.optional(),
        paidBy: referenceSchema,
        split: splitSchema,
        category: z.enum(["food", "transport", "groceries", "travel", "housing", "utilities", "other"]).default("other"),
        paymentType: z.enum(["cash", "card", "upi", "venmo", "unknown"]).default("unknown"),
        date: dateRangeSchema.optional(),
      })
      .strict(),
  })
  .strict();

const editExpenseOperationSchema = z
  .object({
    operationType: z.literal("edit_expense"),
    args: z.object({ expenseRef: referenceSchema }).strict(),
  })
  .strict();

const deleteExpenseOperationSchema = z
  .object({
    operationType: z.literal("delete_expense"),
    args: z.object({ expenseRef: referenceSchema }).strict(),
  })
  .strict();

const settleUpOperationSchema = z
  .object({
    operationType: z.literal("settle_up"),
    args: z
      .object({
        from: referenceSchema,
        to: referenceSchema,
        amountText: z.string().min(1),
        currency: currencySchema,
        paymentType: z.enum(["cash", "card", "upi", "venmo", "unknown"]).default("unknown"),
        date: dateRangeSchema.optional(),
      })
      .strict(),
  })
  .strict();

const changeSplitOperationSchema = z
  .object({
    operationType: z.literal("change_split"),
    args: z.object({ expenseRef: referenceSchema, split: splitSchema }).strict(),
  })
  .strict();

const searchRecordsOperationSchema = z
  .object({
    operationType: z.literal("search_records"),
    args: z
      .object({
        query: z.string().min(1),
        entityTypes: z.array(entityTypeSchema).min(1),
        personRef: referenceSchema.optional(),
        groupRef: referenceSchema.optional(),
        currency: currencySchema.optional(),
        category: z.enum(["food", "transport", "groceries", "travel", "housing", "utilities", "other"]).optional(),
        dateRange: dateRangeSchema.optional(),
        limit: z.number().int().positive().max(50).default(10),
      })
      .strict(),
  })
  .strict();

const openRecordOperationSchema = z
  .object({
    operationType: z.literal("open_record"),
    args: z
      .object({
        entityType: entityTypeSchema,
        recordRef: referenceSchema.optional(),
        searchQuery: z.string().min(1).optional(),
        highlightRef: referenceSchema.optional(),
      })
      .strict(),
  })
  .strict();

const listRecordsOperationSchema = z
  .object({
    operationType: z.literal("list_records"),
    args: z.object({ entityType: entityTypeSchema, groupRef: referenceSchema.optional(), limit: z.number().int().positive().max(50).default(20) }).strict(),
  })
  .strict();

const showPreviousOperationSchema = z
  .object({
    operationType: z.literal("show_previous"),
    args: z.object({ target: z.enum(["last_result_set", "last_record", "active_pending_workflow"]).default("last_result_set") }).strict(),
  })
  .strict();

const getRecordMetadataOperationSchema = z
  .object({
    operationType: z.literal("get_record_metadata"),
    args: z.object({ entityType: entityTypeSchema, recordRef: referenceSchema.optional(), query: z.string().min(1).optional() }).strict(),
  })
  .strict();

const computeOperationSchema = z
  .object({
    operationType: z.enum(["compute_balance", "compute_total", "compute_summary", "compute_date_window_total"]),
    args: z
      .object({
        metric: z.enum(["total_owed_to_me", "total_i_owe", "net_balance", "total_spent", "person_balance", "group_total"]).optional(),
        personRef: referenceSchema.optional(),
        groupRef: referenceSchema.optional(),
        currency: currencySchema.default("USD"),
        dateRange: dateRangeSchema.optional(),
      })
      .strict(),
  })
  .strict();

const clarificationOperationSchema = z
  .object({
    operationType: z.enum(["select_option", "provide_contact_details", "provide_missing_field", "cancel_pending_workflow"]),
    args: z
      .object({
        selection: selectionSchema.optional(),
        displayName: z.string().min(1).optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        fieldName: z.string().min(1).optional(),
        valueText: z.string().min(1).optional(),
      })
      .strict(),
  })
  .strict();

export const workflowOperationSchema = z.discriminatedUnion("operationType", [
  createContactOperationSchema,
  createGroupOperationSchema,
  addGroupMemberOperationSchema,
  removeGroupMemberOperationSchema,
  addExpenseOperationSchema,
  editExpenseOperationSchema,
  deleteExpenseOperationSchema,
  settleUpOperationSchema,
  changeSplitOperationSchema,
  searchRecordsOperationSchema,
  openRecordOperationSchema,
  listRecordsOperationSchema,
  showPreviousOperationSchema,
  getRecordMetadataOperationSchema,
  computeOperationSchema,
  clarificationOperationSchema,
]);

export const workflowIntentSchema = z
  .object({
    schemaVersion: schemaVersionSchema,
    workflowType: workflowTypeSchema,
    workflowVersion: z.string().min(1).default("1.0"),
    modelVersion: z.string().min(1).optional(),
    clientVersion: z.string().min(1).optional(),
    confidence: z.number().min(0).max(1),
    locale: z.string().min(2).default("en-US"),
    currencyHint: currencySchema.optional(),
    pendingWorkflowRef: referenceSchema.optional(),
    pendingEventType: z.string().min(1).optional(),
    operations: z.array(workflowOperationSchema).max(10).default([]),
    missingFields: z.array(z.string().min(1)).default([]),
    ambiguities: z.array(z.string().min(1)).default([]),
  })
  .strict()
  .superRefine((intent, ctx) => {
    if (intent.workflowType !== "unsupported" && intent.operations.length === 0 && intent.missingFields.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "workflow intent must include operations or missingFields unless unsupported",
        path: ["operations"],
      });
    }
  });

export type WorkflowIntent = z.infer<typeof workflowIntentSchema>;
export type WorkflowOperation = z.infer<typeof workflowOperationSchema>;

export type WorkflowStatus =
  | "parsed"
  | "resolving"
  | "needs_user_input"
  | "awaiting_confirmation"
  | "committing"
  | "committed"
  | "cancelled"
  | "failed"
  | "expired";

export type WorkflowRiskClass =
  | "read_only"
  | "draft_only"
  | "financial_write"
  | "membership_write"
  | "destructive_write";

export type WorkflowStateRecord = {
  id: string;
  userId: string;
  accountId?: string;
  sessionId?: string;
  sourceMessageId?: string;
  workflowType: WorkflowIntent["workflowType"];
  status: WorkflowStatus;
  statusReason?: string;
  originalUserMessage: string;
  parsedIntentJson: string;
  resolvedEntitiesJson?: string;
  pendingUiEventJson?: string;
  resultSnapshotJson?: string;
  idempotencyKey: string;
  schemaVersion: string;
  workflowVersion: string;
  modelVersion?: string;
  clientVersion?: string;
  confirmationTokenHash?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  lockedAt?: string;
  committedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
};

export function parseWorkflowIntent(value: unknown): WorkflowIntent {
  return workflowIntentSchema.parse(value);
}

export function riskClassForOperation(operation: WorkflowOperation): WorkflowRiskClass {
  switch (operation.operationType) {
    case "search_records":
    case "open_record":
    case "list_records":
    case "show_previous":
    case "get_record_metadata":
    case "compute_balance":
    case "compute_total":
    case "compute_summary":
    case "compute_date_window_total":
    case "select_option":
    case "provide_contact_details":
    case "provide_missing_field":
    case "cancel_pending_workflow":
      return "read_only";
    case "create_contact":
      return "draft_only";
    case "create_group":
    case "add_group_member":
    case "remove_group_member":
      return "membership_write";
    case "add_expense":
    case "edit_expense":
    case "settle_up":
    case "change_split":
      return "financial_write";
    case "delete_expense":
      return "destructive_write";
  }
}

export function workflowIntentToAppAction(intent: WorkflowIntent, context: { transcript: string; now: string }): AppAction {
  const common = {
    id: createWorkflowActionId(intent.workflowType, context.now),
    transcript: context.transcript,
    confidence: intent.confidence,
  };

  if (intent.missingFields.length > 0) {
    return parseAppAction({
      ...common,
      type: "CLARIFICATION_REQUIRED",
      question: clarificationQuestion(intent.missingFields),
      missingFields: intent.missingFields,
    });
  }

  if (intent.workflowType === "unsupported") {
    return parseAppAction({
      ...common,
      type: "UNSUPPORTED_REQUEST",
      reason: intent.ambiguities[0] ?? "This request is outside Splitmaa's local expense scope.",
    });
  }

  const operations = intent.operations;
  if (intent.workflowType === "multi_step") {
    return parseAppAction({
      ...common,
      type: "DRAFT_EXPENSE_PLAN",
      operations: operations.map((operation) => draftOperationFromWorkflow(operation)).filter(Boolean),
      summary: "Drafted a multi-step Splitmaa workflow.",
    });
  }

  const first = operations[0];
  if (!first) {
    return parseAppAction({
      ...common,
      type: "UNSUPPORTED_REQUEST",
      reason: "FunctionGemma did not include an executable operation.",
    });
  }

  return appActionFromWorkflowOperation(first, common);
}

function appActionFromWorkflowOperation(
  operation: WorkflowOperation,
  common: { id: string; transcript: string; confidence: number },
): AppAction {
  switch (operation.operationType) {
    case "create_contact":
      return parseAppAction({ ...common, type: "CREATE_CONTACT", ...operation.args });
    case "create_group":
      return parseAppAction({
        ...common,
        type: "CREATE_GROUP",
        groupName: operation.args.groupName,
        memberNames: operation.args.members.map(referenceToName).filter(Boolean),
        currency: operation.args.currency,
      });
    case "add_expense":
      return parseAppAction({
        ...common,
        type: "ADD_EXPENSE",
        groupName: operation.args.groupRef ? referenceToName(operation.args.groupRef) : undefined,
        description: operation.args.description,
        amountCents: normalizeAmountText(operation.args.amountText, operation.args.currency),
        currency: operation.args.currency,
        paidByName: referenceToName(operation.args.paidBy),
        participantNames: splitParticipants(operation.args.split),
        splitType: "equal",
        category: operation.args.category,
        paymentType: operation.args.paymentType,
        expenseDate: operation.args.date?.startDate ?? operation.args.date?.dateText,
      });
    case "settle_up":
      return parseAppAction({
        ...common,
        type: "SETTLE_UP",
        fromName: referenceToName(operation.args.from),
        toName: referenceToName(operation.args.to),
        amountCents: normalizeAmountText(operation.args.amountText, operation.args.currency),
        currency: operation.args.currency,
        paymentType: operation.args.paymentType,
        settlementDate: operation.args.date?.startDate ?? operation.args.date?.dateText,
      });
    case "search_records":
      return parseAppAction({
        ...common,
        type: "SEARCH_RECORDS",
        query: operation.args.query,
        entityTypes: operation.args.entityTypes,
        personName: operation.args.personRef ? referenceToName(operation.args.personRef) : undefined,
        groupName: operation.args.groupRef ? referenceToName(operation.args.groupRef) : undefined,
        currency: operation.args.currency,
        category: operation.args.category,
        dateRange: operation.args.dateRange
          ? { startDate: operation.args.dateRange.startDate, endDate: operation.args.dateRange.endDate }
          : undefined,
        limit: operation.args.limit,
      });
    case "open_record":
      return parseAppAction({
        ...common,
        type: "OPEN_RECORD",
        entityType: operation.args.entityType,
        recordId: operation.args.recordRef?.refType === "record_ref" ? operation.args.recordRef.id : undefined,
        searchQuery: operation.args.searchQuery,
        highlightRecordId: operation.args.highlightRef?.refType === "record_ref" ? operation.args.highlightRef.id : undefined,
      });
    case "show_previous":
      return parseAppAction({ ...common, type: "SHOW_SEARCH_RESULTS", resultSetId: operation.args.target });
    case "compute_balance":
      return parseAppAction({
        ...common,
        type: "QUERY_BALANCE",
        personName: operation.args.personRef ? referenceToName(operation.args.personRef) : undefined,
        currency: operation.args.currency,
        dateRange: operation.args.dateRange
          ? { startDate: operation.args.dateRange.startDate, endDate: operation.args.dateRange.endDate }
          : undefined,
      });
    case "compute_total":
    case "compute_summary":
    case "compute_date_window_total":
      return parseAppAction({
        ...common,
        type: "QUERY_FINANCIAL_SUMMARY",
        summaryType: operation.args.metric ?? "net_balance",
        personName: operation.args.personRef ? referenceToName(operation.args.personRef) : undefined,
        groupName: operation.args.groupRef ? referenceToName(operation.args.groupRef) : undefined,
        currency: operation.args.currency,
        dateRange: operation.args.dateRange
          ? { startDate: operation.args.dateRange.startDate, endDate: operation.args.dateRange.endDate }
          : undefined,
      });
    default:
      return parseAppAction({
        ...common,
        type: "UNSUPPORTED_REQUEST",
        reason: `Workflow operation ${operation.operationType} is validated but not executable in this app build yet.`,
      });
  }
}

function draftOperationFromWorkflow(operation: WorkflowOperation) {
  switch (operation.operationType) {
    case "create_contact":
      return { type: "create_contact" as const, ...operation.args };
    case "create_group":
      return {
        type: "create_group" as const,
        groupName: operation.args.groupName,
        memberNames: operation.args.members.map(referenceToName).filter(Boolean),
        currency: operation.args.currency,
      };
    case "add_expense":
      return {
        type: "add_expense" as const,
        groupName: operation.args.groupRef ? referenceToName(operation.args.groupRef) : undefined,
        description: operation.args.description,
        amountCents: normalizeAmountText(operation.args.amountText, operation.args.currency),
        currency: operation.args.currency,
        paidByName: referenceToName(operation.args.paidBy),
        participantNames: splitParticipants(operation.args.split),
        splitType: "equal" as const,
        category: operation.args.category,
        paymentType: operation.args.paymentType,
        expenseDate: operation.args.date?.startDate ?? operation.args.date?.dateText,
      };
    case "settle_up":
      return {
        type: "settle_up" as const,
        fromName: referenceToName(operation.args.from),
        toName: referenceToName(operation.args.to),
        amountCents: normalizeAmountText(operation.args.amountText, operation.args.currency),
        currency: operation.args.currency,
        paymentType: operation.args.paymentType,
        settlementDate: operation.args.date?.startDate ?? operation.args.date?.dateText,
      };
    default:
      return undefined;
  }
}

function referenceToName(reference: z.infer<typeof referenceSchema>): string {
  if (reference.refType === "current_user") return "You";
  if (reference.refType === "name") return reference.value;
  if (reference.refType === "record_ref") return reference.id;
  if (reference.refType === "last_result") return "last result";
  return "active workflow";
}

function splitParticipants(split: z.infer<typeof splitSchema>): string[] {
  if (split.splitType === "full_amount") return [referenceToName(split.participant)];
  return split.participants.map(referenceToName);
}

function clarificationQuestion(missingFields: string[]): string {
  return `I need ${missingFields.join(", ")} before I can continue.`;
}

function createWorkflowActionId(workflowType: WorkflowIntent["workflowType"], now: string): string {
  return `workflow_${workflowType}_${now.replace(/[^0-9]/g, "")}`;
}
