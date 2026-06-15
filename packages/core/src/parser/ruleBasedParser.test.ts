import { describe, expect, it } from "vitest";
import { createInitialLocalAppState } from "../domain/seed";
import { parseRule } from "./ruleBasedParser";

describe("rule based parser", () => {
  it("parses a simple add expense command", () => {
    const action = parseRule({
      transcript: "Add 8 dollars for milk paid by me using credit card split with Alex",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(action.type).toBe("ADD_EXPENSE");
    if (action.type === "ADD_EXPENSE") {
      expect(action.amountCents).toBe(800);
      expect(action.paymentType).toBe("card");
      expect(action.category).toBe("groceries");
    }
  });

  it("parses create group commands with add syntax", () => {
    const action = parseRule({
      transcript: "create a group called california add sai and deepak",
      state: createInitialLocalAppState(),
      now: "2026-06-14T00:00:00.000Z",
    });

    expect(action.type).toBe("CREATE_GROUP");
    if (action.type === "CREATE_GROUP") {
      expect(action.groupName).toBe("california");
      expect(action.memberNames).toEqual(["sai", "deepak"]);
    }
  });
});
