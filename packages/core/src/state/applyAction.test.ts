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

  it("applies a confirmed draft expense plan in order", () => {
    const action = parseAppAction({
      id: "plan1",
      transcript: "create road trip and add coffee",
      confidence: 0.8,
      type: "DRAFT_EXPENSE_PLAN",
      operations: [
        {
          type: "create_group",
          groupName: "Road Trip",
          memberNames: ["Abhishek", "Vishal", "Koushik"],
          currency: "USD",
        },
        {
          type: "add_expense",
          groupName: "Road Trip",
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
      summary: "Road Trip created and coffee added.",
    });

    const result = applyConfirmedAction(
      createInitialLocalAppState("2026-06-14T00:00:00.000Z"),
      action,
      "2026-06-14T01:00:00.000Z",
    );

    const group = result.state.groups.find((item) => item.name === "Road Trip");
    expect(group).toBeTruthy();
    expect(result.state.expenses[0]).toMatchObject({
      description: "coffee",
      amountCents: 2000,
      groupId: group?.id,
    });
    expect(result.state.expenses[0].splits.map((split) => split.amountCents)).toEqual([1000, 1000]);
  });
});
