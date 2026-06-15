import type { AppAction } from "../actions/schemas";
import type { LocalAppState } from "../domain/types";

export type ParserName = "fake" | "rule_based" | "function_gemma";

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
};

export type CommandParser = {
  name: ParserName;
  parse(input: ParserInput): Promise<ParserResult>;
};
