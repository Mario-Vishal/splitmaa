import { parseAppAction } from "../actions/schemas";
import type { CommandParser } from "./types";

export const functionGemmaParser: CommandParser = {
  name: "function_gemma",
  async parse(input) {
    const action = parseAppAction({
      id: `function_gemma_placeholder_${input.now}`,
      transcript: input.transcript,
      confidence: 0,
      type: "UNSUPPORTED_REQUEST",
      reason:
        "FunctionGemma native inference is not wired yet. Use the rule-based parser for the local demo.",
    });

    return {
      parserName: "function_gemma",
      action,
      rawOutput: JSON.stringify({ placeholder: true, action }),
      latencyMs: 0,
      contextSizeChars: JSON.stringify(input.state).length,
      fallbackUsed: true,
    };
  },
};
