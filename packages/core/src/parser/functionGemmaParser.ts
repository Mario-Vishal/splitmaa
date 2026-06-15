import { parseAppAction } from "../actions/schemas";
import type { LocalAppState } from "../domain/types";
import {
  appActionFromModelToolCall,
  modelToolDefinitions,
  parseModelToolCall,
  type ModelToolCall,
  type ModelToolDefinition,
} from "../tools/modelTools";
import type { CommandParser, ModelLifecycleStatus, ParserInput, ParserResult } from "./types";

export type FunctionGemmaRunnerStatus = ModelLifecycleStatus;

export type FunctionGemmaRunnerInput = {
  prompt: string;
  maxTokens: number;
  tools: ModelToolDefinition[];
};

export type FunctionGemmaRunnerResult = {
  text: string;
  toolCall?: ModelToolCall;
  rawToolCall?: unknown;
  latencyMs: number;
  status: FunctionGemmaRunnerStatus;
  error?: string;
};

export type FunctionGemmaToolRunner = {
  getStatus(): Promise<FunctionGemmaRunnerStatus>;
  getLastError?(): Promise<string | undefined>;
  infer(input: FunctionGemmaRunnerInput): Promise<FunctionGemmaRunnerResult>;
};

export type FunctionGemmaParserOptions = {
  runner: FunctionGemmaToolRunner;
  maxTokens?: number;
};

export function createFunctionGemmaParser(options: FunctionGemmaParserOptions): CommandParser {
  return {
    name: "function_gemma",
    async parse(input) {
      const status = await options.runner.getStatus();

      if (status !== "ready") {
        const modelError = await options.runner.getLastError?.();
        return unsupportedResult(input, status, 0, JSON.stringify(input.state).length, modelError, {
          text: "",
          latencyMs: 0,
          status,
          error: modelError,
        });
      }

      const contextSizeChars = JSON.stringify(input.state).length;
      const prompt = createFunctionGemmaPrompt(input);
      const result = await options.runner.infer({
        prompt,
        maxTokens: options.maxTokens ?? 256,
        tools: modelToolDefinitions,
      });

      const toolCall = extractToolCall(result);
      if (!toolCall) {
        const modelError = result.error ?? (await options.runner.getLastError?.());
        return unsupportedResult(input, result.status, result.latencyMs, contextSizeChars, modelError, result);
      }

      try {
        const action = appActionFromModelToolCall(toolCall, {
          transcript: input.transcript,
          now: input.now,
        });

        return {
          parserName: "function_gemma",
          action,
          rawOutput: JSON.stringify({ status: result.status, text: result.text, toolCall }),
          latencyMs: result.latencyMs,
          contextSizeChars,
          fallbackUsed: false,
          modelStatus: result.status,
          modelError: result.error,
        };
      } catch {
        const modelError = result.error ?? (await options.runner.getLastError?.());
        return unsupportedResult(input, result.status, result.latencyMs, contextSizeChars, modelError, result);
      }
    },
  };
}

export const functionGemmaParser: CommandParser = createFunctionGemmaParser({
  runner: createUnavailableFunctionGemmaRunner(),
});

function extractToolCall(result: FunctionGemmaRunnerResult): ModelToolCall | undefined {
  if (result.toolCall) return safeParseToolCall(result.toolCall);
  if (result.rawToolCall) return safeParseToolCall(result.rawToolCall);

  try {
    return safeParseToolCall(JSON.parse(result.text));
  } catch {
    return undefined;
  }
}

function safeParseToolCall(value: unknown): ModelToolCall | undefined {
  try {
    return parseModelToolCall(value);
  } catch {
    return undefined;
  }
}

function unsupportedResult(
  input: ParserInput,
  status: FunctionGemmaRunnerStatus,
  latencyMs: number,
  contextSizeChars: number,
  modelError: string | undefined,
  raw: unknown,
): ParserResult {
  const action = parseAppAction({
    id: `function_gemma_unsupported_${input.now}`,
    transcript: input.transcript,
    confidence: 0,
    type: "UNSUPPORTED_REQUEST",
    reason:
      status === "ready"
        ? unsupportedReadyReason(raw)
        : "FunctionGemma native runner is not ready in this build.",
  });

  return {
    parserName: "function_gemma",
    action,
    rawOutput: JSON.stringify({ status, modelError, raw }),
    latencyMs,
    contextSizeChars,
    fallbackUsed: false,
    modelStatus: status,
    modelError,
  };
}

function unsupportedReadyReason(raw: unknown): string {
  const modelText = extractRawModelText(raw);
  if (!modelText) return "FunctionGemma did not return a valid Splitmaa tool call.";

  return `FunctionGemma did not return a valid Splitmaa tool call. It returned: ${modelText}`;
}

function extractRawModelText(raw: unknown): string | undefined {
  const text =
    typeof raw === "object" && raw && "text" in raw && typeof raw.text === "string"
      ? raw.text
      : typeof raw === "string"
        ? raw
        : undefined;
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  return clean.length > 360 ? `${clean.slice(0, 357)}...` : clean;
}

function createFunctionGemmaPrompt(input: ParserInput): string {
  return JSON.stringify({
    role: "splitmaa_function_calling_parser",
    instruction:
      "Return exactly one tool call matching the provided tools. The app validates and executes tools. Use clarification_required for missing information and unsupported_request for out-of-scope requests.",
    transcript: input.transcript,
    context: compactStateContext(input.state),
  });
}

function compactStateContext(state: LocalAppState) {
  return {
    currentUserContactId: state.currentUserContactId,
    contacts: state.contacts.map((contact) => ({
      id: contact.id,
      displayName: contact.displayName,
      aliases: contact.aliases,
    })),
    groups: state.groups.map((group) => ({
      id: group.id,
      name: group.name,
      defaultCurrency: group.defaultCurrency,
      memberIds: group.memberIds,
    })),
  };
}

function createUnavailableFunctionGemmaRunner(): FunctionGemmaToolRunner {
  return {
    async getStatus() {
      return "not_configured";
    },
    async getLastError() {
      return "FunctionGemma native runner is not configured in this build.";
    },
    async infer() {
      return {
        text: "",
        latencyMs: 0,
        status: "not_configured",
      };
    },
  };
}
