import { describe, expect, it } from "vitest";
import { parseWorkflowIntent, riskClassForOperation, workflowIntentToAppAction } from "./intent";

describe("workflow intent", () => {
  it("validates strict operations and maps amountText to app money", () => {
    const intent = parseWorkflowIntent({
      schemaVersion: "1.0",
      workflowType: "expense_mutation",
      confidence: 0.9,
      operations: [
        {
          operationType: "add_expense",
          args: {
            description: "milk",
            amountText: "$20.15",
            currency: "USD",
            paidBy: { refType: "current_user" },
            split: {
              splitType: "equal",
              participants: [{ refType: "current_user" }, { refType: "name", value: "Pabba" }],
            },
          },
        },
      ],
      missingFields: [],
      ambiguities: [],
    });

    const action = workflowIntentToAppAction(intent, {
      transcript: "add milk twenty dollars and fifteen cents",
      now: "2026-06-15T10:00:00.000Z",
    });

    expect(action.type).toBe("ADD_EXPENSE");
    if (action.type === "ADD_EXPENSE") {
      expect(action.amountCents).toBe(2015);
      expect(action.participantNames).toEqual(["You", "Pabba"]);
    }
  });

  it("classifies operation risk in app-owned code", () => {
    const intent = parseWorkflowIntent({
      schemaVersion: "1.0",
      workflowType: "record_lookup",
      confidence: 0.9,
      operations: [
        {
          operationType: "search_records",
          args: {
            query: "milk",
            entityTypes: ["expense"],
          },
        },
      ],
      missingFields: [],
      ambiguities: [],
    });

    expect(riskClassForOperation(intent.operations[0])).toBe("read_only");
  });

  it("turns incomplete Splitmaa commands into clarification instead of unsupported", () => {
    const intent = parseWorkflowIntent({
      schemaVersion: "1.0",
      workflowType: "expense_mutation",
      confidence: 0.72,
      operations: [],
      missingFields: ["amount", "participants"],
      ambiguities: [],
    });

    const action = workflowIntentToAppAction(intent, {
      transcript: "add dinner",
      now: "2026-06-15T10:00:00.000Z",
    });

    expect(action.type).toBe("CLARIFICATION_REQUIRED");
  });

  it("rejects unknown nested fields", () => {
    expect(() =>
      parseWorkflowIntent({
        schemaVersion: "1.0",
        workflowType: "record_lookup",
        confidence: 0.9,
        operations: [
          {
            operationType: "search_records",
            args: {
              query: "milk",
              entityTypes: ["expense"],
              hacked: true,
            },
          },
        ],
        missingFields: [],
        ambiguities: [],
      }),
    ).toThrow();
  });
});
