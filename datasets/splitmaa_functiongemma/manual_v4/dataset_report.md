# Splitmaa Manual v4 Dataset Report

## Summary
- Rows: `1600`
- Target rows before serious training: `2400`
- Target split: train `1700`, validation `350`, test `350`
- Remaining rows to target: `800`
- Average input words: `10.9`
- Max input words: `39`
- Average operations: `1.2`
- Max operations: `4`

## Split Counts
- `test`: `240`
- `train`: `1120`
- `validation`: `240`

## Workflow Counts
- `clarification_response`: `146`
- `entity_mutation`: `267`
- `expense_mutation`: `373`
- `financial_answer`: `195`
- `multi_step`: `234`
- `record_lookup`: `241`
- `unsupported`: `144`

## Operation Counts
- `add_expense`: `664`
- `add_group_member`: `72`
- `cancel_pending_workflow`: `22`
- `change_split`: `27`
- `compute_balance`: `65`
- `compute_date_window_total`: `44`
- `compute_summary`: `84`
- `compute_total`: `2`
- `create_contact`: `94`
- `create_group`: `270`
- `delete_expense`: `36`
- `edit_expense`: `47`
- `get_record_metadata`: `33`
- `list_records`: `7`
- `open_record`: `70`
- `provide_contact_details`: `15`
- `provide_missing_field`: `26`
- `remove_group_member`: `58`
- `search_records`: `111`
- `select_option`: `83`
- `settle_up`: `65`
- `show_previous`: `20`

## Split Type Counts
- `equal`: `437`
- `full_amount`: `143`
- `percentage`: `111`

## Missing Field Counts
- `amount`: `57`
- `groupName`: `9`
- `group_or_participants`: `5`

## Style Heuristics
- `messyMobileLike`: `1489`
- `cleanLike`: `111`
- `messyMobileLikeRate`: `0.9306`

## Eval Subsets
- `clarification_response`: `146` rows, by split `{'test': 20, 'train': 104, 'validation': 22}`
- `destructive_or_edit`: `168` rows, by split `{'test': 23, 'train': 124, 'validation': 21}`
- `financial_answer`: `195` rows, by split `{'test': 33, 'train': 129, 'validation': 33}`
- `full_amount_splits`: `143` rows, by split `{'test': 24, 'train': 92, 'validation': 27}`
- `long_multi_step`: `234` rows, by split `{'test': 30, 'train': 175, 'validation': 29}`
- `lookup_navigation`: `241` rows, by split `{'test': 34, 'train': 174, 'validation': 33}`
- `messy_mobile_tts`: `1489` rows, by split `{'test': 225, 'train': 1046, 'validation': 218}`
- `missing_fields`: `71` rows, by split `{'test': 4, 'train': 59, 'validation': 8}`
- `percentage_splits`: `111` rows, by split `{'test': 7, 'train': 98, 'validation': 6}`
- `settlements`: `65` rows, by split `{'test': 14, 'train': 41, 'validation': 10}`
- `unsupported_boundary`: `144` rows, by split `{'test': 24, 'train': 96, 'validation': 24}`
