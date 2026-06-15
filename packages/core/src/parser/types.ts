import type { AppAction } from "../actions/schemas";
import type { LocalAppState } from "../domain/types";

export type ParserName = "fake" | "rule_based" | "function_gemma";
export type ModelLifecycleStatus = "not_configured" | "loading" | "ready" | "failed";

export type ParserInput = {
  transcript: string;
  state: LocalAppState;
  now: string;
};

export type ParserResult = {
  parserName: ParserName;
  action: AppAction;
  rawOutput: string;
  latencyMs: number;
  contextSizeChars: number;
  fallbackUsed: boolean;
  modelStatus?: ModelLifecycleStatus;
};

export type CommandParser = {
  name: ParserName;
  parse(input: ParserInput): Promise<ParserResult>;
};
