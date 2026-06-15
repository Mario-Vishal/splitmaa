import { parseAppAction } from "../actions/schemas";
import type { LocalAppState } from "../domain/types";
import {
  appActionFromModelToolCall,
  modelToolDefinitions,
  parseModelToolCall,
  type ModelToolCall,
  type ModelToolDefinition,
} from "../tools/modelTools";
import type { CommandParser, ParserInput, ParserResult } from "./types";

export type FunctionGemmaRunnerStatus = "not_configured" | "loading" | "ready" | "failed";

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
};

export type FunctionGemmaToolRunner = {
  getStatus(): Promise<FunctionGemmaRunnerStatus>;
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
        return unsupportedResult(input, status, 0, JSON.stringify(input.state).length, {
          text: "",
          latencyMs: 0,
          status,
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
        return unsupportedResult(input, result.status, result.latencyMs, contextSizeChars, result);
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
        };
      } catch {
        return unsupportedResult(input, result.status, result.latencyMs, contextSizeChars, result);
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
  raw: unknown,
): ParserResult {
  const action = parseAppAction({
    id: `function_gemma_unsupported_${input.now}`,
    transcript: input.transcript,
    confidence: 0,
    type: "UNSUPPORTED_REQUEST",
    reason:
      status === "ready"
        ? "FunctionGemma did not return a valid Splitmaa tool call."
        : "FunctionGemma native runner is not ready in this build.",
  });

  return {
    parserName: "function_gemma",
    action,
    rawOutput: JSON.stringify({ status, raw }),
    latencyMs,
    contextSizeChars,
    fallbackUsed: false,
  };
}

function createFunctionGemmaPrompt(input: ParserInput): string {
  return JSON.stringify({
    role: "splitmaa_function_calling_parser",
    instruction:
      "Return exactly one tool call matching the provided tools. Do not mutate state. Ask for clarification only by choosing no tool call.",
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
    async infer() {
      return {
        text: "",
        latencyMs: 0,
        status: "not_configured",
      };
    },
  };
}
