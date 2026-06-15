import { describe, expect, it } from "vitest";
import { appActionFromModelToolCall, modelToolDefinitions, parseModelToolCall } from "./modelTools";

describe("model tools", () => {
  it("exports FunctionGemma-callable tool definitions", () => {
    expect(modelToolDefinitions.map((tool) => tool.name)).toEqual([
      "create_group",
      "create_contact",
      "add_expense",
      "settle_up",
      "query_balance",
    ]);
    expect(modelToolDefinitions.find((tool) => tool.name === "query_balance")?.mutatesState).toBe(false);
  });

  it("converts a create_group tool call into a validated app action", () => {
    const call = parseModelToolCall({
      name: "create_group",
      arguments: {
        groupName: "california",
        memberNames: ["sai", "deepak"],
      },
    });

    const action = appActionFromModelToolCall(call, {
      transcript: "create a group called california add sai and deepak",
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(action.type).toBe("CREATE_GROUP");
    if (action.type === "CREATE_GROUP") {
      expect(action.groupName).toBe("california");
      expect(action.memberNames).toEqual(["sai", "deepak"]);
      expect(action.currency).toBe("USD");
    }
  });

  it("rejects invalid tool arguments before app code executes", () => {
    expect(() =>
      parseModelToolCall({
        name: "add_expense",
        arguments: {
          description: "dinner",
          amountCents: -1,
          currency: "USD",
          paidByName: "You",
          participantNames: ["Sai"],
          splitType: "equal",
        },
      }),
    ).toThrow();
  });
});
