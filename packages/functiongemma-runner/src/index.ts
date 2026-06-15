import type { ModelToolCall, ModelToolDefinition } from "@splitmaa/core";

export type FunctionGemmaRunnerStatus = "not_configured" | "loading" | "ready" | "failed";

export type FunctionGemmaInferenceInput = {
  prompt: string;
  maxTokens: number;
  tools?: ModelToolDefinition[];
};

export type FunctionGemmaInferenceResult = {
  text: string;
  toolCall?: ModelToolCall;
  rawToolCall?: unknown;
  latencyMs: number;
  status: FunctionGemmaRunnerStatus;
};

export type FunctionGemmaRunner = {
  getStatus(): Promise<FunctionGemmaRunnerStatus>;
  infer(input: FunctionGemmaInferenceInput): Promise<FunctionGemmaInferenceResult>;
};

export function createUnavailableFunctionGemmaRunner(): FunctionGemmaRunner {
  return {
    async getStatus() {
      return "not_configured";
    },
    async infer() {
      return {
        text: JSON.stringify({
          type: "UNSUPPORTED_REQUEST",
          reason: "FunctionGemma native runner is not configured in this build.",
        }),
        latencyMs: 0,
        status: "not_configured",
      };
    },
  };
}
