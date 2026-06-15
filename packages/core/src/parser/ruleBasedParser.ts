import { parseAppAction, type AppAction } from "../actions/schemas";
import { toCents } from "../domain/money";
import type { ExpenseCategory, PaymentType } from "../domain/types";
import type { CommandParser, ParserInput, ParserResult } from "./types";

export const ruleBasedParser: CommandParser = {
  name: "rule_based",
  async parse(input): Promise<ParserResult> {
    const startedAt = Date.now();
    const action = parseRule(input);

    return {
      parserName: "rule_based",
      action,
      rawOutput: JSON.stringify(action),
      latencyMs: Date.now() - startedAt,
      contextSizeChars: JSON.stringify({
        contacts: input.state.contacts.map((contact) => contact.displayName),
        groups: input.state.groups.map((group) => group.name),
      }).length,
      fallbackUsed: false,
    };
  },
};

export function parseRule(input: ParserInput): AppAction {
  const transcript = input.transcript.trim();
  const lower = transcript.toLowerCase();
  const id = `action_${input.now}`;

  const groupMatch = transcript.match(/create a group called ([\w\s]+?)(?: with (.+))?$/i);
  if (groupMatch) {
    return parseAppAction({
      id,
      transcript,
      confidence: 0.84,
      type: "CREATE_GROUP",
      groupName: groupMatch[1].trim(),
      memberNames: splitNames(groupMatch[2] ?? ""),
      currency: "USD",
    });
  }

  if (lower.includes("how much") && lower.includes("owe")) {
    const personName = findKnownName(transcript, input.state.contacts);
    return parseAppAction({
      id,
      transcript,
      confidence: 0.72,
      type: "QUERY_BALANCE",
      personName,
      currency: "USD",
    });
  }

  const expenseMatch = transcript.match(
    /add\s+([\d.]+)\s+(dollars?|usd|rupees?|inr)?\s+for\s+(.+?)(?:\s+paid by\s+(.+?))?(?:\s+(?:using|with)\s+.+?)?(?:\s+split\s+(?:with|between)\s+(.+))?$/i,
  );
  if (expenseMatch) {
    const participantNames = splitNames(expenseMatch[5] ?? "");

    if (participantNames.length === 0) {
      return parseAppAction({
        id,
        transcript,
        confidence: 0.68,
        type: "CLARIFICATION_REQUIRED",
        question: "Who should this expense be split with?",
        missingFields: ["participantNames"],
      });
    }

    return parseAppAction({
      id,
      transcript,
      confidence: 0.78,
      type: "ADD_EXPENSE",
      description: expenseMatch[3].trim(),
      amountCents: toCents(expenseMatch[1]),
      currency: lower.includes("rupee") || lower.includes("inr") ? "INR" : "USD",
      paidByName: normalizePayer(expenseMatch[4] ?? "me"),
      participantNames: ["You", ...participantNames],
      splitType: "equal",
      category: inferCategory(expenseMatch[3]),
      paymentType: inferPaymentType(lower),
    });
  }

  return parseAppAction({
    id,
    transcript,
    confidence: 0.5,
    type: "UNSUPPORTED_REQUEST",
    reason: "I can help with groups, expenses, settlements, spending summaries, contacts, and balances.",
  });
}

function splitNames(value: string): string[] {
  return value
    .replace(/\band\b/gi, ",")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizePayer(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized === "me" ? "You" : value.trim();
}

function inferPaymentType(value: string): PaymentType {
  if (value.includes("credit") || value.includes("card")) return "card";
  if (value.includes("cash")) return "cash";
  if (value.includes("upi")) return "upi";
  if (value.includes("venmo")) return "venmo";
  return "unknown";
}

function inferCategory(description: string): ExpenseCategory {
  const value = description.toLowerCase();
  if (value.includes("dinner") || value.includes("lunch") || value.includes("breakfast")) return "food";
  if (value.includes("uber") || value.includes("taxi") || value.includes("train")) return "transport";
  if (value.includes("milk") || value.includes("grocery")) return "groceries";
  return "other";
}

function findKnownName(transcript: string, contacts: ParserInput["state"]["contacts"]): string | undefined {
  const lower = transcript.toLowerCase();
  return contacts.find((contact) => lower.includes(contact.displayName.toLowerCase()))?.displayName;
}
