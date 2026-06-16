#!/usr/bin/env python3
"""Evaluate Splitmaa FunctionGemma workflow-intent outputs.

The evaluator scores model outputs against the canonical staging JSONL shape:

{"id": "...", "input": "...", "expected": {"name": "extract_workflow_intent", "arguments": {...}}}

It can score saved predictions, run a command per example, or self-test by using
the expected tool call as the prediction.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "finetune"))

import validate_splitmaa_dataset as validator  # noqa: E402


IGNORED_EXACT_KEYS = {"confidence", "locale", "workflowVersion", "modelVersion", "clientVersion", "ambiguities"}
DEFAULT_REPORT_PATH = Path("reports/functiongemma_eval/latest.json")


@dataclass
class Prediction:
    value: Any
    raw: str
    latency_ms: int | None = None
    error: str | None = None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=Path("datasets/splitmaa_functiongemma/test.jsonl"))
    parser.add_argument("--predictions", type=Path, help="JSONL file with id plus output/text/rawOutput/toolCall/actual.")
    parser.add_argument("--model-command", help="Command that reads the prompt on stdin and prints the model output.")
    parser.add_argument("--self-test-with-expected", action="store_true", help="Use expected tool calls as predictions.")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--fail-under-schema-valid", type=float, default=0.0)
    parser.add_argument("--fail-under-workflow", type=float, default=0.0)
    parser.add_argument("--fail-under-operation-sequence", type=float, default=0.0)
    parser.add_argument("--failure-limit", type=int, default=50)
    args = parser.parse_args()

    source_count = sum([bool(args.predictions), bool(args.model_command), bool(args.self_test_with_expected)])
    if source_count != 1:
        parser.error("Choose exactly one of --predictions, --model-command, or --self-test-with-expected.")

    examples = read_jsonl(args.dataset)
    if args.limit:
        examples = examples[: args.limit]

    prediction_map = read_predictions(args.predictions) if args.predictions else {}
    results = []
    started = time.time()

    for example in examples:
        prediction = predict_for_example(example, args, prediction_map)
        results.append(score_example(example, prediction))

    report = build_report(results, args.dataset, args, round((time.time() - started) * 1000))
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2, ensure_ascii=True))
    print(f"report: {args.report}")

    summary = report["summary"]
    failed_threshold = (
        summary["schemaValidRate"] < args.fail_under_schema_valid
        or summary["workflowAccuracy"] < args.fail_under_workflow
        or summary["operationSequenceAccuracy"] < args.fail_under_operation_sequence
    )
    return 1 if failed_threshold else 0


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            clean = line.strip()
            if not clean:
                continue
            try:
                rows.append(json.loads(clean))
            except json.JSONDecodeError as exc:
                raise SystemExit(f"{path}:{line_number}: invalid JSON: {exc}") from exc
    return rows


def read_predictions(path: Path | None) -> dict[str, Prediction]:
    if not path:
        return {}
    predictions = {}
    for row in read_jsonl(path):
        row_id = row.get("id")
        if not isinstance(row_id, str) or not row_id:
            raise SystemExit(f"{path}: every prediction row must include a non-empty string id")
        value = first_present(row, ["actual", "actualToolCall", "toolCall", "rawToolCall", "output", "text", "rawOutput"])
        raw = value if isinstance(value, str) else json.dumps(value, ensure_ascii=True)
        predictions[row_id] = Prediction(value=value, raw=raw, latency_ms=row.get("latencyMs"), error=row.get("error"))
    return predictions


def first_present(row: dict[str, Any], keys: list[str]) -> Any:
    for key in keys:
        if key in row:
            return row[key]
    raise SystemExit(f"prediction row {row.get('id')!r} must include one of {', '.join(keys)}")


def predict_for_example(example: dict[str, Any], args: argparse.Namespace, predictions: dict[str, Prediction]) -> Prediction:
    if args.self_test_with_expected:
        return Prediction(value=example["expected"], raw=json.dumps(example["expected"], ensure_ascii=True), latency_ms=0)
    if args.predictions:
        prediction = predictions.get(example["id"])
        if prediction is None:
            return Prediction(value=None, raw="", error="missing prediction")
        return prediction

    prompt = build_prompt(example["input"])
    started = time.time()
    completed = subprocess.run(
        args.model_command,
        input=prompt,
        text=True,
        shell=True,
        capture_output=True,
        cwd=ROOT,
    )
    latency_ms = round((time.time() - started) * 1000)
    raw = completed.stdout.strip()
    error = None
    if completed.returncode != 0:
        error = completed.stderr.strip() or f"model command exited with {completed.returncode}"
    return Prediction(value=raw, raw=raw, latency_ms=latency_ms, error=error)


def build_prompt(user_input: str) -> str:
    return "\n".join(
        [
            "You are Splitmaa's local FunctionGemma workflow intent extractor.",
            "Return exactly one JSON tool call with name extract_workflow_intent.",
            "The JSON shape must be:",
            '{"name":"extract_workflow_intent","arguments":{"schemaVersion":"1.0","workflowType":"...","confidence":0.0,"operations":[],"missingFields":[],"ambiguities":[]}}',
            "Use names and natural references only; the app owns trusted IDs, database lookup, confirmation, and execution.",
            "",
            f"User: {user_input}",
        ]
    )


def score_example(example: dict[str, Any], prediction: Prediction) -> dict[str, Any]:
    expected_call = example["expected"]
    parsed_call, parse_error = parse_prediction(prediction.value)
    schema_errors = validate_call(example["id"], example["input"], parsed_call) if parsed_call is not None else [parse_error or "parse failed"]

    expected_args = expected_call["arguments"]
    actual_args = parsed_call.get("arguments") if isinstance(parsed_call, dict) else None
    actual_args = actual_args if isinstance(actual_args, dict) else {}

    expected_ops = operation_types(expected_args)
    actual_ops = operation_types(actual_args)
    leaf_score = leaf_accuracy(expected_args, actual_args)
    exact_match = normalized_intent(expected_args) == normalized_intent(actual_args)

    result = {
        "id": example["id"],
        "input": example["input"],
        "workflowType": expected_args.get("workflowType"),
        "toolNameMatch": parsed_call.get("name") == expected_call["name"] if isinstance(parsed_call, dict) else False,
        "parseable": parsed_call is not None,
        "schemaValid": len(schema_errors) == 0,
        "workflowMatch": actual_args.get("workflowType") == expected_args.get("workflowType"),
        "operationCountMatch": len(actual_ops) == len(expected_ops),
        "operationSequenceMatch": actual_ops == expected_ops,
        "missingFieldsMatch": actual_args.get("missingFields", []) == expected_args.get("missingFields", []),
        "exactIntentMatch": exact_match,
        "expectedOperationTypes": expected_ops,
        "actualOperationTypes": actual_ops,
        "leafAccuracy": leaf_score["accuracy"],
        "leafMatches": leaf_score["matches"],
        "leafTotal": leaf_score["total"],
        "schemaErrors": schema_errors,
        "parseError": parse_error,
        "predictionError": prediction.error,
        "latencyMs": prediction.latency_ms,
    }

    if not result["exactIntentMatch"] or not result["schemaValid"]:
        result["expected"] = expected_call
        result["actual"] = parsed_call
        result["rawOutput"] = prediction.raw[:4000]

    return result


def parse_prediction(value: Any) -> tuple[dict[str, Any] | None, str | None]:
    if isinstance(value, dict):
        return normalize_tool_call_shape(value), None
    if value is None:
        return None, "empty prediction"
    if not isinstance(value, str):
        return None, f"unsupported prediction type {type(value).__name__}"

    stripped = value.strip()
    if not stripped:
        return None, "empty prediction"

    for candidate in json_candidates(stripped):
        normalized = normalize_tool_call_shape(candidate)
        if normalized is not None:
            return normalized, None
    return None, "could not parse a JSON tool call from model output"


def json_candidates(text: str) -> list[Any]:
    decoder = json.JSONDecoder()
    candidates = []
    for index, char in enumerate(text):
        if char not in "{[":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
            candidates.append(value)
        except json.JSONDecodeError:
            continue
    return candidates


def normalize_tool_call_shape(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None

    if value.get("name") == "extract_workflow_intent" and isinstance(value.get("arguments"), dict):
        return {"name": value["name"], "arguments": value["arguments"]}

    function_value = value.get("function")
    if isinstance(function_value, dict) and function_value.get("name") == "extract_workflow_intent":
        arguments = function_value.get("arguments")
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                return None
        if isinstance(arguments, dict):
            return {"name": "extract_workflow_intent", "arguments": arguments}

    tool_calls = value.get("tool_calls") or value.get("toolCalls")
    if isinstance(tool_calls, list):
        for tool_call in tool_calls:
            normalized = normalize_tool_call_shape(tool_call)
            if normalized:
                return normalized

    if value.get("schemaVersion") == "1.0" and "workflowType" in value:
        return {"name": "extract_workflow_intent", "arguments": value}

    return None


def validate_call(row_id: str, user_input: str, call: dict[str, Any] | None) -> list[str]:
    if call is None:
        return ["missing tool call"]
    item = {"id": row_id, "input": user_input, "expected": call}
    return validator.validate_item(item, Path("<prediction>"), 1, set())


def operation_types(intent_args: dict[str, Any]) -> list[str]:
    operations = intent_args.get("operations")
    if not isinstance(operations, list):
        return []
    return [operation.get("operationType") for operation in operations if isinstance(operation, dict)]


def normalized_intent(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: normalized_intent(val) for key, val in sorted(value.items()) if key not in IGNORED_EXACT_KEYS}
    if isinstance(value, list):
        return [normalized_intent(item) for item in value]
    return value


def leaf_accuracy(expected: dict[str, Any], actual: dict[str, Any]) -> dict[str, Any]:
    expected_flat = flatten(normalized_intent(expected))
    if not expected_flat:
        return {"matches": 0, "total": 0, "accuracy": 1.0}
    actual_normalized = normalized_intent(actual)
    matches = 0
    for path, expected_value in expected_flat.items():
        if get_path(actual_normalized, path) == expected_value:
            matches += 1
    total = len(expected_flat)
    return {"matches": matches, "total": total, "accuracy": round(matches / total, 4)}


def flatten(value: Any, prefix: tuple[Any, ...] = ()) -> dict[tuple[Any, ...], Any]:
    if isinstance(value, dict):
        rows = {}
        for key, item in value.items():
            rows.update(flatten(item, prefix + (key,)))
        return rows
    if isinstance(value, list):
        rows = {}
        for index, item in enumerate(value):
            rows.update(flatten(item, prefix + (index,)))
        return rows
    return {prefix: value}


def get_path(value: Any, path: tuple[Any, ...]) -> Any:
    current = value
    for part in path:
        if isinstance(part, int):
            if not isinstance(current, list) or part >= len(current):
                return None
            current = current[part]
        else:
            if not isinstance(current, dict) or part not in current:
                return None
            current = current[part]
    return current


def build_report(results: list[dict[str, Any]], dataset: Path, args: argparse.Namespace, elapsed_ms: int) -> dict[str, Any]:
    total = len(results)
    by_workflow: dict[str, dict[str, Any]] = defaultdict(lambda: {"examples": 0})
    for result in results:
        bucket = by_workflow[result["workflowType"]]
        bucket["examples"] += 1
        for key in [
            "parseable",
            "schemaValid",
            "toolNameMatch",
            "workflowMatch",
            "operationCountMatch",
            "operationSequenceMatch",
            "missingFieldsMatch",
            "exactIntentMatch",
        ]:
            bucket[key] = bucket.get(key, 0) + int(result[key])
        bucket["leafAccuracySum"] = bucket.get("leafAccuracySum", 0.0) + result["leafAccuracy"]

    for bucket in by_workflow.values():
        examples = bucket["examples"]
        for key in [
            "parseable",
            "schemaValid",
            "toolNameMatch",
            "workflowMatch",
            "operationCountMatch",
            "operationSequenceMatch",
            "missingFieldsMatch",
            "exactIntentMatch",
        ]:
            bucket[key + "Rate"] = round(bucket[key] / examples, 4)
        bucket["leafAccuracy"] = round(bucket["leafAccuracySum"] / examples, 4)
        del bucket["leafAccuracySum"]

    failures = [
        result
        for result in results
        if not result["schemaValid"] or not result["workflowMatch"] or not result["operationSequenceMatch"] or not result["exactIntentMatch"]
    ]

    return {
        "summary": {
            "dataset": str(dataset),
            "mode": eval_mode(args),
            "examples": total,
            "elapsedMs": elapsed_ms,
            "parseableRate": rate(results, "parseable"),
            "schemaValidRate": rate(results, "schemaValid"),
            "toolNameAccuracy": rate(results, "toolNameMatch"),
            "workflowAccuracy": rate(results, "workflowMatch"),
            "operationCountAccuracy": rate(results, "operationCountMatch"),
            "operationSequenceAccuracy": rate(results, "operationSequenceMatch"),
            "missingFieldsAccuracy": rate(results, "missingFieldsMatch"),
            "exactIntentAccuracy": rate(results, "exactIntentMatch"),
            "leafArgumentAccuracy": round(sum(result["leafAccuracy"] for result in results) / total, 4) if total else 0,
            "failures": len(failures),
        },
        "byWorkflow": dict(sorted(by_workflow.items())),
        "failures": failures[: args.failure_limit],
    }


def rate(results: list[dict[str, Any]], key: str) -> float:
    return round(sum(int(result[key]) for result in results) / len(results), 4) if results else 0.0


def eval_mode(args: argparse.Namespace) -> str:
    if args.self_test_with_expected:
        return "self_test_with_expected"
    if args.predictions:
        return "predictions"
    return "model_command"


if __name__ == "__main__":
    raise SystemExit(main())
