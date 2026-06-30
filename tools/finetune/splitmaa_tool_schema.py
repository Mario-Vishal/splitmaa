"""Shared Splitmaa FunctionGemma tool schema for fine-tuning artifacts.

Keep this compact. FunctionGemma training includes the tool definition in
every example. A fully expanded nested JSON Schema pushes prompt length past
2.5k-5k tokens before the assistant answer, which is impractical on the local
12 GB Windows GPU and causes answer-label truncation at our safe lengths.
"""

from __future__ import annotations

from typing import Any


WORKFLOW_TYPES = [
    "entity_mutation",
    "expense_mutation",
    "multi_step",
    "record_lookup",
    "financial_answer",
    "clarification_response",
    "unsupported",
]

OPERATION_TYPES = [
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
]

CONTRACT = (
    "Use exactly one extract_workflow_intent call. Use only names/references, never invented trusted IDs. "
    "Refs: {refType:current_user}, {refType:name,value}, {refType:record_ref,entityType,id}, "
    "{refType:last_result}, {refType:active_pending_workflow}. "
    "Currencies: USD, INR. Entity types: contact, group, expense, settlement, activity_log. "
    "Metrics: total_owed_to_me, total_i_owe, net_balance, total_spent, person_balance, group_total. "
    "Splits: equal uses participants; full_amount uses participant; percentage uses allocations with participant and percentText. "
    "Arg keys by op: create_contact displayName/email/phone; create_group groupName/members/currency; "
    "add_group_member/remove_group_member groupRef/member/memberRef; "
    "add_expense description/amountText/currency/groupRef/paidBy/split/category/paymentType/date; "
    "edit_expense expenseRef/recordRef/groupRef/amountText/currency/paidBy/updates; "
    "delete_expense expenseRef/recordRef/groupRef/date; settle_up from/to/amountText/currency/paymentType/date; "
    "change_split expenseRef/recordRef/groupRef/split; "
    "search_records query/entityTypes/personRef/groupRef/currency/category/dateRange/limit; "
    "open_record entityType/recordRef/searchQuery/highlightRef; "
    "list_records entityType/groupRef/memberRef/personRef/query/dateRange/limit; "
    "show_previous target; get_record_metadata entityType/recordRef/query; "
    "compute_* metric/personRef/groupRef/currency/dateRange; "
    "select_option selection; provide_contact_details displayName/email/emailText/phone; "
    "provide_missing_field field/value/fields; cancel_pending_workflow reason."
)


TOOL_SCHEMA: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "extract_workflow_intent",
        "description": CONTRACT,
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "required": ["schemaVersion", "workflowType", "confidence", "operations", "missingFields", "ambiguities"],
            "properties": {
                "schemaVersion": {"type": "string", "const": "1.0"},
                "workflowVersion": {"type": "string"},
                "modelVersion": {"type": "string"},
                "clientVersion": {"type": "string"},
                "workflowType": {"type": "string", "enum": WORKFLOW_TYPES},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "locale": {"type": "string"},
                "currencyHint": {"type": "string", "enum": ["USD", "INR"]},
                "pendingWorkflowRef": {"type": "object"},
                "pendingEventType": {"type": "string"},
                "operations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["operationType", "args"],
                        "properties": {
                            "operationType": {"type": "string", "enum": OPERATION_TYPES},
                            "args": {"type": "object", "description": "Use only the arg keys allowed in the function description."},
                        },
                    },
                },
                "missingFields": {"type": "array", "items": {"type": "string"}},
                "ambiguities": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
}


TOOLS = [TOOL_SCHEMA]
