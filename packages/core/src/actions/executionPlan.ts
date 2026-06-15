import type { AppAction } from "./schemas";

export type ExecutionStepStatus = "pending" | "running" | "complete" | "failed";

export type ExecutionStep = {
  id: string;
  type: "validate" | "resolve_context" | "confirm" | "persist" | "answer";
  label: string;
  status: ExecutionStepStatus;
};

export function createExecutionPlan(action: AppAction): ExecutionStep[] {
  if (action.type === "QUERY_BALANCE") {
    return [
      step("validate", "Validate balance question"),
      step("resolve_context", "Read balances from local data"),
      step("answer", "Show grounded answer"),
    ];
  }

  if (action.type === "CLARIFICATION_REQUIRED" || action.type === "UNSUPPORTED_REQUEST") {
    return [step("answer", "Respond without changing app data")];
  }

  return [
    step("validate", `Validate ${action.type.toLowerCase().replaceAll("_", " ")}`),
    step("resolve_context", "Resolve contacts, group, and currency"),
    step("confirm", "Ask for explicit confirmation"),
    step("persist", "Save deterministic local update"),
  ];
}

function step(type: ExecutionStep["type"], label: string): ExecutionStep {
  return {
    id: `${type}_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    type,
    label,
    status: "pending",
  };
}
