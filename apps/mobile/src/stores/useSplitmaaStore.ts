import {
  applyConfirmedAction,
  calculateBalances,
  createInitialDiagnostics,
  createInitialLocalAppState,
  formatMoney,
  parseAppAction,
  type LocalAppState,
  type RuntimeDiagnostics,
} from "@splitmaa/core";
import { create } from "zustand";
import {
  clearLocalAppState,
  loadLocalAppState,
  saveLocalAppState,
  type PersistenceLoadResult,
} from "../storage/localPersistence";

type PersistenceStatus = "idle" | "hydrating" | "ready" | "saving" | "error";

type SplitmaaStore = {
  state: LocalAppState;
  diagnostics: RuntimeDiagnostics;
  hydrated: boolean;
  persistenceStatus: PersistenceStatus;
  lastPersistenceSource?: PersistenceLoadResult["source"];
  lastMessage?: string;
  hydrate: () => Promise<void>;
  addSampleExpense: () => Promise<void>;
  resetLocalState: () => Promise<void>;
};

export const useSplitmaaStore = create<SplitmaaStore>((set, get) => ({
  state: createInitialLocalAppState(),
  diagnostics: createInitialDiagnostics(),
  hydrated: false,
  persistenceStatus: "idle",
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
    } catch {
      set({
        hydrated: true,
        persistenceStatus: "error",
        lastMessage: "Could not load local data.",
      });
    }
  },
  async addSampleExpense() {
    const now = new Date().toISOString();
    const action = parseAppAction({
      id: `action_sample_${now}`,
      transcript: "Add 8 dollars for milk paid by me using credit card split with Alex",
      confidence: 0.9,
      type: "ADD_EXPENSE",
      description: "milk",
      amountCents: 800,
      currency: "USD",
      paidByName: "You",
      participantNames: ["You", "Alex"],
      splitType: "equal",
      category: "groceries",
      paymentType: "card",
    });

    const result = applyConfirmedAction(get().state, action, now);
    set({ state: result.state, persistenceStatus: "saving", lastMessage: result.message });
    await saveLocalAppState(result.state);
    set({ persistenceStatus: "ready" });
  },
  async resetLocalState() {
    const state = createInitialLocalAppState();
    set({ state, persistenceStatus: "saving", lastMessage: "Reset local demo data." });
    await clearLocalAppState();
    await saveLocalAppState(state);
    set({ persistenceStatus: "ready", lastPersistenceSource: "seed" });
  },
}));

export function selectDashboardSnapshot(state: LocalAppState) {
  const balances = calculateBalances({
    currentUserContactId: state.currentUserContactId,
    expenses: state.expenses,
    settlements: state.settlements,
    currency: "USD",
  });
  const totalExpenseCents = state.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return {
    contactCount: state.contacts.length,
    groupCount: state.groups.length,
    expenseCount: state.expenses.length,
    totalExpenses: formatMoney(totalExpenseCents, "USD"),
    topBalance: balances[0],
    balances,
  };
}
