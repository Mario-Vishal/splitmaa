import { describe, expect, it } from "vitest";
import { createInitialLocalAppState } from "../domain/seed";
import { modelToolDefinitions } from "../tools/modelTools";
import { createFunctionGemmaParser, type FunctionGemmaToolRunner } from "./functionGemmaParser";

describe("functionGemmaParser", () => {
  it("passes only extract_workflow_intent to the runner and returns a validated app action", async () => {
    let receivedToolNames: string[] = [];
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "ready";
      },
      async infer(input) {
        receivedToolNames = input.tools.map((tool) => tool.name);
        return {
          text: "",
          rawToolCall: {
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
                  },
                },
              ],
              missingFields: [],
              ambiguities: [],
            },
          },
          latencyMs: 12,
          status: "ready",
        };
      },
    };

    const parser = createFunctionGemmaParser({ runner });
    const result = await parser.parse({
      transcript: "create a group called california add sai and deepak",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(receivedToolNames).toEqual(modelToolDefinitions.map((tool) => tool.name));
    expect(result.parserName).toBe("function_gemma");
    expect(result.fallbackUsed).toBe(false);
    expect(result.action.type).toBe("CREATE_GROUP");
    if (result.action.type === "CREATE_GROUP") {
      expect(result.action.groupName).toBe("california");
      expect(result.action.memberNames).toEqual(["You", "sai", "deepak"]);
    }
  });

  it("accepts raw JSON workflow tool calls from the runner", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "ready";
      },
      async infer() {
        return {
          text: JSON.stringify({
            name: "extract_workflow_intent",
            arguments: {
              schemaVersion: "1.0",
              workflowType: "financial_answer",
              confidence: 0.86,
              operations: [
                {
                  operationType: "compute_balance",
                  args: {
                    personRef: { refType: "name", value: "Alex" },
                    currency: "USD",
                  },
                },
              ],
              missingFields: [],
              ambiguities: [],
            },
          }),
          latencyMs: 8,
          status: "ready",
        };
      },
    };

    const parser = createFunctionGemmaParser({ runner });
    const result = await parser.parse({
      transcript: "how much does alex owe me",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(result.action.type).toBe("QUERY_BALANCE");
    if (result.action.type === "QUERY_BALANCE") {
      expect(result.action.personName).toBe("Alex");
      expect(result.action.currency).toBe("USD");
    }
  });

  it("does not fall back when the runner is not ready", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "not_configured";
      },
      async infer() {
        throw new Error("infer should not run when status is not ready");
      },
    };

    const parser = createFunctionGemmaParser({ runner });
    const result = await parser.parse({
      transcript: "create a group called california add sai and deepak",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(result.fallbackUsed).toBe(false);
    expect(result.action.type).toBe("UNSUPPORTED_REQUEST");
  });

  it("rejects invalid runner output without falling back after inference", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "ready";
      },
      async infer() {
        return {
          text: JSON.stringify({
            name: "extract_workflow_intent",
            arguments: {
              schemaVersion: "1.0",
              workflowType: "expense_mutation",
              confidence: 0.7,
              operations: [
                {
                  operationType: "add_expense",
                  args: {
                    description: "dinner",
                    amountText: "-1",
                    currency: "USD",
                    paidBy: { refType: "current_user" },
                    split: {
                      splitType: "equal",
                      participants: [{ refType: "name", value: "Sai" }],
                    },
                  },
                },
              ],
              missingFields: [],
              ambiguities: [],
            },
          }),
          latencyMs: 5,
          status: "ready",
        };
      },
    };

    const parser = createFunctionGemmaParser({ runner });
    const result = await parser.parse({
      transcript: "add impossible dinner",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(result.parserName).toBe("function_gemma");
    expect(result.fallbackUsed).toBe(false);
    expect(result.action.type).toBe("UNSUPPORTED_REQUEST");
  });
});
