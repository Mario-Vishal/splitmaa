import {
  applyConfirmedAction,
  calculateBalances,
  createExecutionPlan,
  createFunctionGemmaParser,
  createInitialDiagnostics,
  createInitialLocalAppState,
  formatMoney,
  type AiActionLog,
  type AppAction,
  type ExecutionStep,
  type LocalAppState,
  type ParserResult,
  type RuntimeDiagnostics,
} from "@splitmaa/core";
import { DEFAULT_ANDROID_MODEL_PATH, createNativeFunctionGemmaRunner } from "@splitmaa/functiongemma-runner";
import { create } from "zustand";
import {
  clearLocalAppState,
  loadLocalAppState,
  saveLocalAppState,
  type PersistenceLoadResult,
} from "../storage/localPersistence";

type PersistenceStatus = "idle" | "hydrating" | "ready" | "saving" | "error";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type GuidedSummaryNode = {
  id: string;
  label: string;
  detail: string;
  tone: "primary" | "success" | "neutral";
};

export type GuidedExecution = {
  status: "idle" | "running" | "complete";
  progress: number;
  commentary: string;
  summaryTitle?: string;
  summaryNodes: GuidedSummaryNode[];
};

type GuidedCallbacks = {
  onOpenGroups?: () => void;
};

type SplitmaaStore = {
  state: LocalAppState;
  diagnostics: RuntimeDiagnostics;
  hydrated: boolean;
  persistenceStatus: PersistenceStatus;
  lastPersistenceSource?: PersistenceLoadResult["source"];
  lastMessage?: string;
  assistantMessages: AssistantMessage[];
  pendingAction?: AppAction;
  executionPlan: ExecutionStep[];
  executionCommentary: string[];
  guidedExecution: GuidedExecution;
  selectedGroupId?: string;
  selectedContactId?: string;
  hydrate: () => Promise<void>;
  selectGroup: (groupId?: string) => void;
  selectContact: (contactId?: string) => void;
  runGuidedCommand: (transcript: string, callbacks?: GuidedCallbacks) => Promise<boolean>;
  parseCommand: (transcript: string) => Promise<void>;
  confirmPendingAction: () => Promise<void>;
  cancelPendingAction: () => void;
  addSampleExpense: () => Promise<void>;
  resetLocalState: () => Promise<void>;
  refreshModelStatus: () => Promise<void>;
};

export const exampleCommands = [
  "Create a group called Goa Trip with Alex and Priya",
  "Add 8 dollars for milk paid by me using credit card split with Alex",
  "Add 60 dollars for dinner paid by me split with Alex and Priya",
  "How much does Alex owe me?",
  "Write me a poem",
] as const;

const functionGemmaRunner = createNativeFunctionGemmaRunner({
  modelPath: DEFAULT_ANDROID_MODEL_PATH,
});

const assistantParser = createFunctionGemmaParser({
  runner: functionGemmaRunner,
});

export const useSplitmaaStore = create<SplitmaaStore>((set, get) => ({
  state: createInitialLocalAppState(),
  diagnostics: createInitialDiagnostics(),
  hydrated: false,
  persistenceStatus: "idle",
  assistantMessages: [],
  executionPlan: [],
  executionCommentary: [],
  guidedExecution: {
    status: "idle",
    progress: 0,
    commentary: "",
    summaryNodes: [],
  },
  selectedGroupId: undefined,
  selectedContactId: undefined,
  selectGroup(groupId) {
    set({ selectedGroupId: groupId });
  },
  selectContact(contactId) {
    set({ selectedContactId: contactId });
  },
  async runGuidedCommand(transcript, callbacks) {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return false;

    const now = new Date().toISOString();
    const result = await assistantParser.parse({
      transcript: cleanTranscript,
      state: get().state,
      now,
    });

    if (result.action.type !== "CREATE_GROUP") {
      return false;
    }

    const action = result.action;
    const executionPlan = createExecutionPlan(action);
    const diagnostics = diagnosticsFromParserResult(result, now);

    set({
      diagnostics,
      pendingAction: undefined,
      executionPlan,
      executionCommentary: [],
      guidedExecution: {
        status: "running",
        progress: 0.08,
        commentary: "Fetching contacts...",
        summaryNodes: [],
      },
      assistantMessages: [userMessage(cleanTranscript, now)],
      lastMessage: "Creating group.",
    });

    await wait(450);
    set((current) => ({
      guidedExecution: {
        ...current.guidedExecution,
        progress: 0.28,
        commentary: `Checking local database for ${action.memberNames.join(" and ")}...`,
      },
    }));

    await wait(450);
    set((current) => ({
      guidedExecution: {
        ...current.guidedExecution,
        progress: 0.52,
        commentary: `Creating ${action.groupName}...`,
      },
    }));

    const committedAt = new Date().toISOString();
    const applyResult = applyConfirmedAction(get().state, action, committedAt);
    const createdGroup = applyResult.state.groups.find(
      (group) => group.name.toLowerCase() === action.groupName.toLowerCase(),
    );
    const log: AiActionLog = {
      id: `log_${committedAt.replace(/[^0-9]/g, "")}`,
      transcript: action.transcript,
      parserName: result.parserName,
      parsedActionType: action.type,
      validationStatus: "valid",
      executionStatus: "completed",
      contextSizeChars: result.contextSizeChars,
      latencyMs: result.latencyMs,
      fallbackUsed: result.fallbackUsed,
      createdAt: committedAt,
    };
    const nextState: LocalAppState = {
      ...applyResult.state,
      aiActionLogs: [log, ...applyResult.state.aiActionLogs],
      updatedAt: committedAt,
    };

    await wait(450);
    set((current) => ({
      state: nextState,
      selectedGroupId: createdGroup?.id,
      persistenceStatus: "saving",
      guidedExecution: {
        ...current.guidedExecution,
        progress: 0.76,
        commentary: `Adding ${action.memberNames.length} members...`,
      },
    }));
    await saveLocalAppState(nextState);

    await wait(350);
    callbacks?.onOpenGroups?.();
    set((current) => ({
      persistenceStatus: "ready",
      executionPlan: current.executionPlan.map((step) => ({ ...step, status: "complete" })),
      executionCommentary: [
        "Checked local contacts",
        `Created ${action.groupName}`,
        `Added ${action.memberNames.join(", ")}`,
        "Opened group page",
      ],
      guidedExecution: {
        ...current.guidedExecution,
        progress: 0.92,
        commentary: "Opening group...",
      },
    }));

    await wait(350);
    set({
      guidedExecution: {
        status: "complete",
        progress: 1,
        commentary: "Group ready.",
        summaryTitle: `${action.groupName} created`,
        summaryNodes: [
          {
            id: "group",
            label: action.groupName,
            detail: "Group",
            tone: "primary",
          },
          ...action.memberNames.map((name) => ({
            id: `member_${name}`,
            label: name,
            detail: "Member",
            tone: "success" as const,
          })),
        ],
      },
      lastMessage: `${action.groupName} created.`,
    });

    return true;
  },
  async hydrate() {
    set({ persistenceStatus: "hydrating" });
    try {
      const result = await loadLocalAppState();
      set({
        state: result.state,
        hydrated: true,
        persistenceStatus: "ready",
        lastPersistenceSource: result.source,
        lastMessage: result.source === "storage" ? "Loaded local data." : "Started from seed data.",
      });
      void get().refreshModelStatus();
    } catch {
      set({
        hydrated: true,
        persistenceStatus: "error",
        lastMessage: "Could not load local data.",
      });
      void get().refreshModelStatus();
    }
  },
  async parseCommand(transcript) {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;

    const now = new Date().toISOString();
    set((current) => ({
      assistantMessages: [...current.assistantMessages, userMessage(cleanTranscript, now)],
      executionCommentary: [],
    }));

    const result = await assistantParser.parse({
      transcript: cleanTranscript,
      state: get().state,
      now,
    });
    const action = result.action;
    const executionPlan = createExecutionPlan(action);
    const diagnostics = diagnosticsFromParserResult(result, now);

    if (action.type === "QUERY_BALANCE") {
      set((current) => ({
        diagnostics,
        pendingAction: undefined,
        executionPlan,
        assistantMessages: [
          ...current.assistantMessages,
          assistantMessage(answerBalance(current.state, action), now),
        ],
        lastMessage: "Answered from local data.",
      }));
      return;
    }

    if (action.type === "CLARIFICATION_REQUIRED") {
      set((current) => ({
        diagnostics,
        pendingAction: undefined,
        executionPlan,
        assistantMessages: [...current.assistantMessages, assistantMessage(action.question, now)],
        lastMessage: "Clarification required.",
      }));
      return;
    }

    if (action.type === "UNSUPPORTED_REQUEST") {
      set((current) => ({
        diagnostics,
        pendingAction: undefined,
        executionPlan,
        assistantMessages: [...current.assistantMessages, assistantMessage(action.reason, now)],
        lastMessage: "Unsupported request.",
      }));
      return;
    }

    set((current) => ({
      diagnostics,
      pendingAction: action,
      executionPlan,
      assistantMessages: [
        ...current.assistantMessages,
        assistantMessage("I parsed a safe action. Confirm before I change local data.", now),
      ],
      lastMessage: `Proposed ${action.type}.`,
    }));
  },
  async confirmPendingAction() {
    const action = get().pendingAction;
    if (!action) return;

    const now = new Date().toISOString();
    const result = applyConfirmedAction(get().state, action, now);
    const log: AiActionLog = {
      id: `log_${now.replace(/[^0-9]/g, "")}`,
      transcript: action.transcript,
      parserName: get().diagnostics.parserName,
      parsedActionType: action.type,
      validationStatus: "valid",
      executionStatus: "completed",
      contextSizeChars: get().diagnostics.contextSizeChars,
      latencyMs: get().diagnostics.latencyMs,
      fallbackUsed: get().diagnostics.fallbackUsed,
      createdAt: now,
    };
    const nextState: LocalAppState = {
      ...result.state,
      aiActionLogs: [log, ...result.state.aiActionLogs],
      updatedAt: now,
    };

    set((current) => ({
      state: nextState,
      pendingAction: undefined,
      executionPlan: current.executionPlan.map((step) => ({ ...step, status: "complete" })),
      executionCommentary: current.executionPlan.map((step) => step.label),
      persistenceStatus: "saving",
      assistantMessages: [...current.assistantMessages, assistantMessage(result.message, now)],
      lastMessage: result.message,
    }));
    await saveLocalAppState(nextState);
    set({ persistenceStatus: "ready" });
  },
  cancelPendingAction() {
    const now = new Date().toISOString();
    set((current) => ({
      pendingAction: undefined,
      executionPlan: [],
      assistantMessages: [...current.assistantMessages, assistantMessage("Cancelled. No data changed.", now)],
      lastMessage: "Cancelled pending action.",
    }));
  },
  async addSampleExpense() {
    await get().parseCommand("Add 8 dollars for milk paid by me using credit card split with Alex");
  },
  async resetLocalState() {
    const state = createInitialLocalAppState();
    set({
      state,
      pendingAction: undefined,
      executionPlan: [],
      executionCommentary: [],
      guidedExecution: {
        status: "idle",
        progress: 0,
        commentary: "",
        summaryNodes: [],
      },
      persistenceStatus: "saving",
      lastMessage: "Reset local demo data.",
    });
    await clearLocalAppState();
    await saveLocalAppState(state);
    set({ persistenceStatus: "ready", lastPersistenceSource: "seed" });
  },
  async refreshModelStatus() {
    const now = new Date().toISOString();
    const modelStatus = await functionGemmaRunner.getStatus();
    const modelError = await functionGemmaRunner.getLastError?.();
    set((current) => ({
      diagnostics: {
        ...current.diagnostics,
        parserName: "function_gemma",
        modelStatus,
        modelError,
        offlineReady: modelStatus === "ready",
        updatedAt: now,
      },
    }));
  },
}));

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function selectDashboardSnapshot(state: LocalAppState) {
  const balances = calculateBalances({
    currentUserContactId: state.currentUserContactId,
    expenses: state.expenses,
    settlements: state.settlements,
    currency: "USD",
  });
  const totalExpenseCents = state.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const youAreOwedCents = balances
    .filter((balance) => balance.amountCents > 0)
    .reduce((sum, balance) => sum + balance.amountCents, 0);
  const youOweCents = balances
    .filter((balance) => balance.amountCents < 0)
    .reduce((sum, balance) => sum + Math.abs(balance.amountCents), 0);

  return {
    contactCount: state.contacts.length,
    groupCount: state.groups.length,
    expenseCount: state.expenses.length,
    totalExpenses: formatMoney(totalExpenseCents, "USD"),
    youAreOwed: formatMoney(youAreOwedCents, "USD"),
    youOwe: formatMoney(youOweCents, "USD"),
    youAreOwedCents,
    youOweCents,
    topBalance: balances[0],
    balances,
  };
}

function answerBalance(state: LocalAppState, action: Extract<AppAction, { type: "QUERY_BALANCE" }>): string {
  const balances = calculateBalances({
    currentUserContactId: state.currentUserContactId,
    expenses: state.expenses,
    settlements: state.settlements,
    currency: action.currency,
  });
  const contact = action.personName
    ? state.contacts.find((item) => item.displayName.toLowerCase() === action.personName?.toLowerCase())
    : undefined;
  const balance = contact
    ? balances.find((item) => item.contactId === contact.id)
    : balances[0];

  if (!balance) return "No open balance found in local data.";

  const name = state.contacts.find((item) => item.id === balance.contactId)?.displayName ?? "That person";
  if (balance.amountCents > 0) {
    return `${name} owes you ${formatMoney(balance.amountCents, balance.currency)}.`;
  }

  return `You owe ${name} ${formatMoney(Math.abs(balance.amountCents), balance.currency)}.`;
}

function userMessage(text: string, createdAt = new Date().toISOString()): AssistantMessage {
  return {
    id: `user_${createdAt}_${text}`,
    role: "user",
    text,
    createdAt,
  };
}

function assistantMessage(text: string, createdAt = new Date().toISOString()): AssistantMessage {
  return {
    id: `assistant_${createdAt}_${text}`,
    role: "assistant",
    text,
    createdAt,
  };
}

function diagnosticsFromParserResult(result: ParserResult, updatedAt: string): RuntimeDiagnostics {
  const modelStatus = result.modelStatus ?? "not_configured";

  return {
    parserName: result.parserName,
    modelStatus,
    modelError: result.modelError,
    contextSizeChars: result.contextSizeChars,
    latencyMs: result.latencyMs,
    fallbackUsed: result.fallbackUsed,
    offlineReady: modelStatus === "ready",
    updatedAt,
  };
}
