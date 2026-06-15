import type { ModelLifecycleStatus, ParserName } from "../parser/types";
export type { ModelLifecycleStatus } from "../parser/types";

export type RuntimeDiagnostics = {
  parserName: ParserName;
  modelStatus: ModelLifecycleStatus;
  modelError?: string;
  contextSizeChars: number;
  latencyMs: number;
  fallbackUsed: boolean;
  offlineReady: boolean;
  updatedAt: string;
};

export function createInitialDiagnostics(now = new Date().toISOString()): RuntimeDiagnostics {
  return {
    parserName: "rule_based",
    modelStatus: "not_configured",
    contextSizeChars: 0,
    latencyMs: 0,
    fallbackUsed: false,
    offlineReady: true,
    updatedAt: now,
  };
}
