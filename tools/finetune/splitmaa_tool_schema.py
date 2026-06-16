"""Shared Splitmaa FunctionGemma tool schema for fine-tuning artifacts."""

from __future__ import annotations

from typing import Any


TOOL_SCHEMA: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "extract_workflow_intent",
        "description": (
            "Extract one strict Splitmaa workflow intent. The app owns trusted IDs, SQLite lookup, "
            "UI clarification, confirmation, money/date normalization, commits, navigation, and audit."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "required": ["schemaVersion", "workflowType", "confidence", "operations", "missingFields", "ambiguities"],
            "properties": {
                "schemaVersion": {"type": "string", "const": "1.0"},
                "workflowVersion": {"type": "string"},
                "modelVersion": {"type": "string"},
                "clientVersion": {"type": "string"},
                "workflowType": {
                    "type": "string",
                    "enum": [
                        "entity_mutation",
                        "expense_mutation",
                        "multi_step",
                        "record_lookup",
                        "financial_answer",
                        "clarification_response",
                        "unsupported",
                    ],
                },
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "locale": {"type": "string"},
                "currencyHint": {"type": "string", "enum": ["USD", "INR"]},
                "pendingWorkflowRef": {"$ref": "#/$defs/reference"},
                "pendingEventType": {"type": "string"},
                "operations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["operationType", "args"],
                        "properties": {
                            "operationType": {
                                "type": "string",
                                "enum": [
                                    "create_contact",
                                    "create_group",
                                    "add_group_member",
                                    "remove_group_member",
                                    "add_expense",
                                    "edit_expense",
                                    "delete_expense",
                                    "settle_up",
                                    "change_split",
                                    "search_records",
                                    "open_record",
                                    "list_records",
                                    "show_previous",
                                    "get_record_metadata",
                                    "compute_balance",
                                    "compute_total",
                                    "compute_summary",
                                    "compute_date_window_total",
                                    "select_option",
                                    "provide_contact_details",
                                    "provide_missing_field",
                                    "cancel_pending_workflow",
                                ],
                            },
                            "args": {"type": "object"},
                        },
                    },
                },
                "missingFields": {"type": "array", "items": {"type": "string"}},
                "ambiguities": {"type": "array", "items": {"type": "string"}},
            },
            "$defs": {
                "reference": {
                    "oneOf": [
                        {"type": "object", "required": ["refType"], "properties": {"refType": {"const": "current_user"}}},
                        {
                            "type": "object",
                            "required": ["refType", "value"],
                            "properties": {"refType": {"const": "name"}, "value": {"type": "string"}},
                        },
                        {
                            "type": "object",
                            "required": ["refType", "entityType", "id"],
                            "properties": {
                                "refType": {"const": "record_ref"},
                                "entityType": {"type": "string"},
                                "id": {"type": "string"},
                            },
                        },
                        {"type": "object", "required": ["refType"], "properties": {"refType": {"const": "last_result"}}},
                        {
                            "type": "object",
                            "required": ["refType"],
                            "properties": {"refType": {"const": "active_pending_workflow"}},
                        },
                    ]
                }
            },
        },
    },
}


TOOLS = [TOOL_SCHEMA]
