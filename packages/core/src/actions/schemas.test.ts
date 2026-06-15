import { describe, expect, it } from "vitest";
import { createExecutionPlan } from "./executionPlan";
import { parseAppAction } from "./schemas";

describe("action schemas", () => {
  it("accepts a valid add expense action", () => {
    const action = parseAppAction({
      id: "a1",
      transcript: "Add 8 dollars for milk paid by me split with Alex",
      confidence: 0.8,
      type: "ADD_EXPENSE",
      description: "milk",
      amountCents: 800,
      currency: "USD",
      paidByName: "You",
      participantNames: ["You", "Alex"],
      splitType: "equal",
      category: "groceries",
      paymentType: "card",
    });

    expect(action.type).toBe("ADD_EXPENSE");
    expect(createExecutionPlan(action).map((step) => step.type)).toEqual([
      "validate",
      "resolve_context",
      "confirm",
      "persist",
    ]);
  });

  it("rejects mutation actions with non-integer money", () => {
    expect(() =>
      parseAppAction({
        id: "a1",
        transcript: "bad",
        confidence: 0.8,
        type: "ADD_EXPENSE",
        description: "milk",
        amountCents: 8.5,
        currency: "USD",
        paidByName: "You",
        participantNames: ["Alex"],
        splitType: "equal",
      }),
    ).toThrow();
  });
});
