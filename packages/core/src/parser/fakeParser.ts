import { parseAppAction } from "../actions/schemas";
import { toCents } from "../domain/money";
import type { CommandParser } from "./types";

export const fakeParser: CommandParser = {
  name: "fake",
  async parse(input) {
    const action = parseAppAction({
      id: `fake_${input.now}`,
      transcript: input.transcript,
      confidence: 1,
      type: "ADD_EXPENSE",
      description: "demo expense",
      amountCents: toCents("12"),
      currency: "USD",
      paidByName: "You",
      participantNames: ["You", "Alex"],
      splitType: "equal",
      category: "other",
      paymentType: "unknown",
    });

    return {
      parserName: "fake",
      action,
      rawOutput: JSON.stringify(action),
      latencyMs: 0,
      contextSizeChars: JSON.stringify(input.state).length,
      fallbackUsed: false,
    };
  },
};
