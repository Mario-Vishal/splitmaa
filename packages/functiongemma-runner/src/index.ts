import type { FunctionGemmaToolRunner } from "@splitmaa/core";

export type {
  FunctionGemmaRunnerInput,
  FunctionGemmaRunnerResult,
  FunctionGemmaRunnerStatus,
  FunctionGemmaToolRunner,
} from "@splitmaa/core";

export type FunctionGemmaRunner = FunctionGemmaToolRunner;

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
