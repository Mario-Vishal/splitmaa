import { describe, expect, it } from "vitest";
import { createInitialLocalAppState } from "../domain/seed";
import { modelToolDefinitions } from "../tools/modelTools";
import { createFunctionGemmaParser, type FunctionGemmaToolRunner } from "./functionGemmaParser";
import { ruleBasedParser } from "./ruleBasedParser";

describe("functionGemmaParser", () => {
  it("passes Splitmaa tools to the runner and returns a validated app action", async () => {
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
            name: "create_group",
            arguments: {
              groupName: "california",
              memberNames: ["sai", "deepak"],
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
      expect(result.action.memberNames).toEqual(["sai", "deepak"]);
    }
  });

  it("accepts raw JSON tool calls from the runner", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "ready";
      },
      async infer() {
        return {
          text: JSON.stringify({
            name: "query_balance",
            arguments: {
              personName: "Alex",
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

  it("uses the thin fallback parser when the runner is not ready", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "not_configured";
      },
      async infer() {
        throw new Error("infer should not run when status is not ready");
      },
    };

    const parser = createFunctionGemmaParser({ runner, fallbackParser: ruleBasedParser });
    const result = await parser.parse({
      transcript: "create a group called california add sai and deepak",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.action.type).toBe("CREATE_GROUP");
  });

  it("rejects invalid runner output without falling back after inference", async () => {
    const runner: FunctionGemmaToolRunner = {
      async getStatus() {
        return "ready";
      },
      async infer() {
        return {
          text: JSON.stringify({
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
          latencyMs: 5,
          status: "ready",
        };
      },
    };

    const parser = createFunctionGemmaParser({ runner, fallbackParser: ruleBasedParser });
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
