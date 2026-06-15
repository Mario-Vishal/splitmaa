import type {
  FunctionGemmaRunnerInput,
  FunctionGemmaRunnerResult,
  FunctionGemmaRunnerStatus,
  FunctionGemmaToolRunner,
  ModelToolDefinition,
} from "@splitmaa/core";
import { getNativeSplitmaaFunctionGemmaModule } from "./NativeSplitmaaFunctionGemma";

export type {
  FunctionGemmaRunnerInput,
  FunctionGemmaRunnerResult,
  FunctionGemmaRunnerStatus,
  FunctionGemmaToolRunner,
} from "@splitmaa/core";

export type FunctionGemmaRunner = FunctionGemmaToolRunner;

export type NativeFunctionGemmaRunnerOptions = {
  modelPath: string;
  maxTokens?: number;
  maxTopK?: number;
};

export const DEFAULT_ANDROID_MODEL_PATH = "/data/local/tmp/llm/splitmaa_functiongemma.task";

export function createNativeFunctionGemmaRunner(options: NativeFunctionGemmaRunnerOptions): FunctionGemmaRunner {
  let configured = false;
  let lastStatus: FunctionGemmaRunnerStatus = "not_configured";
  let lastError: string | undefined;

  async function ensureConfigured(): Promise<FunctionGemmaRunnerStatus> {
    const nativeModule = getNativeSplitmaaFunctionGemmaModule();
    if (!nativeModule) {
      lastStatus = "not_configured";
      lastError = "SplitmaaFunctionGemma native module is not available in this build.";
      return lastStatus;
    }

    if (configured && lastStatus === "ready") {
      return nativeModule.getStatus();
    }

    const state = await nativeModule.configure({
      modelPath: options.modelPath,
      maxTokens: options.maxTokens,
      maxTopK: options.maxTopK,
    });
    configured = state.status === "ready";
    lastStatus = state.status;
    lastError = state.lastError;
    return lastStatus;
  }

  return {
    async getStatus() {
      return ensureConfigured();
    },
    async getLastError() {
      const nativeModule = getNativeSplitmaaFunctionGemmaModule();
      if (!nativeModule) return lastError;
      return (await nativeModule.getLastError()) ?? lastError;
    },
    async infer(input) {
      const status = await ensureConfigured();
      if (status !== "ready") {
        return {
          text: "",
          latencyMs: 0,
          status,
          error: lastError,
        };
      }

      const nativeModule = getNativeSplitmaaFunctionGemmaModule();
      if (!nativeModule) {
        return {
          text: "",
          latencyMs: 0,
          status: "not_configured",
          error: "SplitmaaFunctionGemma native module is not available in this build.",
        };
      }

      const result = await nativeModule.infer({
        prompt: createToolCallingPrompt(input),
      });

      return {
        text: result.text,
        latencyMs: result.latencyMs,
        status: result.status,
        error: result.error,
      };
    },
  };
}

export function createUnavailableFunctionGemmaRunner(): FunctionGemmaRunner {
  return {
    async getStatus() {
      return "not_configured";
    },
    async getLastError() {
      return "FunctionGemma native runner is not configured in this build.";
    },
    async infer() {
      return {
        text: JSON.stringify({
          type: "UNSUPPORTED_REQUEST",
          reason: "FunctionGemma native runner is not configured in this build.",
        }),
        latencyMs: 0,
        status: "not_configured",
        error: "FunctionGemma native runner is not configured in this build.",
      };
    },
  };
}

function createToolCallingPrompt(input: FunctionGemmaRunnerInput): string {
  return [
    "You are Splitmaa's on-device function-calling model.",
    "Return exactly one JSON object and no markdown.",
    'The JSON shape must be: {"name":"tool_name","arguments":{...}}.',
    "Choose only from these tools:",
    JSON.stringify(input.tools.map(serializeToolForPrompt)),
    "User/context payload:",
    input.prompt,
  ].join("\n");
}

function serializeToolForPrompt(tool: ModelToolDefinition) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}
