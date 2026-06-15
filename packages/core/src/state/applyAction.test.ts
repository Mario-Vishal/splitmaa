import { describe, expect, it } from "vitest";
import { parseAppAction } from "../actions/schemas";
import { createInitialLocalAppState } from "../domain/seed";
import { applyConfirmedAction } from "./applyAction";

describe("applyConfirmedAction", () => {
  it("adds a confirmed expense with integer splits", () => {
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

    const result = applyConfirmedAction(
      createInitialLocalAppState("2026-06-14T00:00:00.000Z"),
      action,
      "2026-06-14T01:00:00.000Z",
    );

    expect(result.state.expenses[0].description).toBe("milk");
    expect(result.state.expenses[0].splits.map((split) => split.amountCents)).toEqual([400, 400]);
  });
});
