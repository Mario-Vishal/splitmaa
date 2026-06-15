import { describe, expect, it } from "vitest";
import { createInitialLocalAppState } from "../domain/seed";
import { answerLocalQuery, searchLocalRecords } from "./localQueries";

describe("local queries", () => {
  it("answers person balances from local data", () => {
    const result = answerLocalQuery(createInitialLocalAppState(), {
      id: "q1",
      transcript: "how much does alex owe me",
      confidence: 0.8,
      type: "QUERY_BALANCE",
      personName: "Alex",
      currency: "USD",
    });

    expect(result.answer).toBe("Alex owes you $20.00.");
    expect(result.records[0]?.entityType).toBe("contact");
  });

  it("summarizes group totals with navigable records", () => {
    const result = answerLocalQuery(createInitialLocalAppState(), {
      id: "q2",
      transcript: "how much was goa trip",
      confidence: 0.8,
      type: "QUERY_FINANCIAL_SUMMARY",
      summaryType: "group_total",
      groupName: "Goa Trip",
      currency: "USD",
    });

    expect(result.answer).toBe("Goa Trip has $60.00 logged.");
    expect(result.records.map((record) => record.entityType)).toEqual(["group", "expense"]);
  });

  it("filters searches by text, type, and date window", () => {
    const results = searchLocalRecords(createInitialLocalAppState(), {
      id: "q3",
      transcript: "search dinner last month",
      confidence: 0.8,
      type: "SEARCH_RECORDS",
      query: "dinner",
      entityTypes: ["expense"],
      dateRange: {
        startDate: "2026-06-01T00:00:00.000Z",
        endDate: "2026-06-30T23:59:59.999Z",
      },
      limit: 10,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: "expense",
      id: "expense_dinner",
      title: "Dinner",
    });
  });
});
