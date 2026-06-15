import argparse
import json
import re
import sys
from pathlib import Path


def parse_rule(text):
    lower = text.lower()

    group_match = re.search(r"create a group called ([\w\s]+?)(?: with (.+))?$", text, re.I)
    if group_match:
        return {
            "function": "CREATE_GROUP",
            "arguments": {
                "groupName": group_match.group(1).strip(),
                "memberNames": split_names(group_match.group(2) or ""),
            },
        }

    if "how much" in lower and "owe" in lower:
        person = next((name for name in ["Alex", "Priya", "Rahul"] if name.lower() in lower), None)
        return {"function": "QUERY_BALANCE", "arguments": {"personName": person}}

    expense_match = re.search(
        r"add\s+([\d.]+)\s+(dollars?|usd|rupees?|inr)?\s+for\s+(.+?)(?:\s+paid by\s+(.+?))?(?:\s+(?:using|with)\s+.+?)?(?:\s+split\s+(?:with|between)\s+(.+))?$",
        text,
        re.I,
    )
    if expense_match:
        return {
            "function": "ADD_EXPENSE",
            "arguments": {
                "amountCents": int(float(expense_match.group(1)) * 100),
                "currency": "INR" if "rupee" in lower or "inr" in lower else "USD",
                "description": expense_match.group(3).strip(),
                "paymentType": "card" if "card" in lower or "credit" in lower else "unknown",
                "participantNames": ["You", *split_names(expense_match.group(5) or "")],
            },
        }

    return {"function": "UNSUPPORTED_REQUEST", "arguments": {}}


def split_names(value):
    return [part.strip() for part in re.sub(r"\band\b", ",", value, flags=re.I).split(",") if part.strip()]


def score(expected, actual):
    function_ok = expected["function"] == actual["function"]
    expected_args = expected.get("arguments", {})
    matched_args = 0
    for key, value in expected_args.items():
        if actual.get("arguments", {}).get(key) == value:
            matched_args += 1
    arg_total = max(len(expected_args), 1)
    return function_ok, matched_args / arg_total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    rows = []
    with Path(args.dataset).open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))

    if args.limit:
        rows = rows[: args.limit]

    function_hits = 0
    arg_scores = []
    for row in rows:
        actual = parse_rule(row["input"])
        function_ok, arg_score = score(row["expected"], actual)
        function_hits += int(function_ok)
        arg_scores.append(arg_score)

    result = {
        "examples": len(rows),
        "function_accuracy": round(function_hits / len(rows), 4) if rows else 0,
        "argument_accuracy": round(sum(arg_scores) / len(arg_scores), 4) if arg_scores else 0,
        "parser": "python_rule_based_smoke",
    }
    print(json.dumps(result, indent=2))
    return 0 if result["function_accuracy"] >= 0.8 else 1


if __name__ == "__main__":
    sys.exit(main())
