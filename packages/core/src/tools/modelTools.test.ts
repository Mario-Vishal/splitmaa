import { describe, expect, it } from "vitest";
import { appActionFromModelToolCall, modelToolDefinitions, parseModelToolCall } from "./modelTools";

describe("model tools", () => {
  it("exports only the FunctionGemma workflow intent tool", () => {
    expect(modelToolDefinitions.map((tool) => tool.name)).toEqual(["extract_workflow_intent"]);
    expect(modelToolDefinitions[0].mutatesState).toBe(false);
    expect(modelToolDefinitions[0].requiresConfirmation).toBe(false);
  });

  it("converts a create_group workflow intent into a validated app action", () => {
    const call = parseModelToolCall({
      name: "extract_workflow_intent",
      arguments: {
        schemaVersion: "1.0",
        workflowType: "entity_mutation",
        confidence: 0.91,
        operations: [
          {
            operationType: "create_group",
            args: {
              groupName: "california",
              members: [
                { refType: "current_user" },
                { refType: "name", value: "sai" },
                { refType: "name", value: "deepak" },
              ],
              currency: "USD",
            },
          },
        ],
        missingFields: [],
        ambiguities: [],
      },
    });

    const action = appActionFromModelToolCall(call, {
      transcript: "create a group called california add sai and deepak",
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(action.type).toBe("CREATE_GROUP");
    if (action.type === "CREATE_GROUP") {
      expect(action.groupName).toBe("california");
      expect(action.memberNames).toEqual(["You", "sai", "deepak"]);
      expect(action.currency).toBe("USD");
    }
  });

  it("converts a complex multi-step workflow into a draft app action and normalizes amountText", () => {
    const call = parseModelToolCall({
      name: "extract_workflow_intent",
      arguments: {
        schemaVersion: "1.0",
        workflowType: "multi_step",
        confidence: 0.91,
        operations: [
          {
            operationType: "create_group",
            args: {
              groupName: "Road trip",
              members: [
                { refType: "current_user" },
                { refType: "name", value: "Abhishek" },
                { refType: "name", value: "Vishal" },
                { refType: "name", value: "Koushik" },
              ],
              currency: "USD",
            },
          },
          {
            operationType: "add_expense",
            args: {
              groupRef: { refType: "name", value: "Road trip" },
              description: "coffee",
              amountText: "$20",
              currency: "USD",
              paidBy: { refType: "current_user" },
              split: {
                splitType: "equal",
                participants: [
                  { refType: "name", value: "Abhishek" },
                  { refType: "name", value: "Koushik" },
                ],
              },
              category: "food",
              paymentType: "unknown",
            },
          },
        ],
        missingFields: [],
        ambiguities: [],
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
        amountCents: 2000,
        participantNames: ["Abhishek", "Koushik"],
      });
    }
  });

  it("rejects unknown top-level fields and unknown operation types", () => {
    expect(() =>
      parseModelToolCall({
        name: "extract_workflow_intent",
        arguments: {
          schemaVersion: "1.0",
          workflowType: "entity_mutation",
          confidence: 0.8,
          operations: [],
          missingFields: ["groupName"],
          ambiguities: [],
          unexpected: true,
        },
      }),
    ).toThrow();

    expect(() =>
      parseModelToolCall({
        name: "extract_workflow_intent",
        arguments: {
          schemaVersion: "1.0",
          workflowType: "entity_mutation",
          confidence: 0.8,
          operations: [{ operationType: "invented_operation", args: {} }],
          missingFields: [],
          ambiguities: [],
        },
      }),
    ).toThrow();
  });

  it("rejects unsupported v1 currencies", () => {
    expect(() =>
      parseModelToolCall({
        name: "extract_workflow_intent",
        arguments: {
          schemaVersion: "1.0",
          workflowType: "financial_answer",
          confidence: 0.88,
          operations: [
            {
              operationType: "compute_balance",
              args: {
                currency: "EUR",
              },
            },
          ],
          missingFields: [],
          ambiguities: [],
        },
      }),
    ).toThrow();
  });
});
