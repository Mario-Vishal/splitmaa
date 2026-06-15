import { describe, expect, it } from "vitest";
import { appActionFromModelToolCall, modelToolDefinitions, parseModelToolCall } from "./modelTools";

describe("model tools", () => {
  it("exports FunctionGemma-callable tool definitions", () => {
    expect(modelToolDefinitions.map((tool) => tool.name)).toEqual([
      "create_group",
      "create_contact",
      "add_expense",
      "settle_up",
      "draft_expense_plan",
      "query_balance",
      "query_financial_summary",
      "search_records",
      "open_record",
      "show_search_results",
      "clarification_required",
      "unsupported_request",
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

  it("converts a complex draft plan tool call into a validated app action", () => {
    const call = parseModelToolCall({
      name: "draft_expense_plan",
      arguments: {
        operations: [
          {
            type: "create_group",
            groupName: "Road trip",
            memberNames: ["You", "Abhishek", "Vishal", "Koushik"],
            currency: "USD",
          },
          {
            type: "add_expense",
            groupName: "Road trip",
            description: "coffee",
            amountCents: 2000,
            currency: "USD",
            paidByName: "You",
            participantNames: ["Abhishek", "Koushik"],
            splitType: "equal",
            category: "food",
            paymentType: "unknown",
          },
        ],
        summary: "Create Road trip and add coffee.",
      },
    });

    const action = appActionFromModelToolCall(call, {
      transcript: "create a group and add coffee",
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(action.type).toBe("DRAFT_EXPENSE_PLAN");
    if (action.type === "DRAFT_EXPENSE_PLAN") {
      expect(action.operations).toHaveLength(2);
      expect(action.operations[1]).toMatchObject({
        type: "add_expense",
        participantNames: ["Abhishek", "Koushik"],
      });
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

  it("rejects unsupported v1 currencies", () => {
    expect(() =>
      parseModelToolCall({
        name: "query_balance",
        arguments: {
          currency: "EUR",
        },
      }),
    ).toThrow();
  });
});
