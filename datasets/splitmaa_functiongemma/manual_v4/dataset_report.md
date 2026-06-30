# Splitmaa Manual v4 Dataset Report

## Summary
- Rows: `1000`
- Target rows before serious training: `2400`
- Target split: train `1700`, validation `350`, test `350`
- Remaining rows to target: `1400`
- Average input words: `10.8`
- Max input words: `38`
- Average operations: `1.21`
- Max operations: `4`

## Split Counts
- `test`: `150`
- `train`: `700`
- `validation`: `150`

## Workflow Counts
- `clarification_response`: `94`
- `entity_mutation`: `175`
- `expense_mutation`: `213`
- `financial_answer`: `123`
- `multi_step`: `154`
- `record_lookup`: `149`
- `unsupported`: `92`

## Operation Counts
- `add_expense`: `440`
- `add_group_member`: `46`
- `cancel_pending_workflow`: `15`
- `change_split`: `13`
- `compute_balance`: `40`
- `compute_date_window_total`: `21`
- `compute_summary`: `61`
- `compute_total`: `1`
- `create_contact`: `62`
- `create_group`: `181`
- `delete_expense`: `14`
- `edit_expense`: `16`
- `get_record_metadata`: `23`
- `list_records`: `1`
- `open_record`: `36`
- `provide_contact_details`: `9`
- `provide_missing_field`: `20`
- `remove_group_member`: `33`
- `search_records`: `75`
- `select_option`: `50`
- `settle_up`: `38`
- `show_previous`: `14`

## Split Type Counts
- `equal`: `284`
- `full_amount`: `101`
- `percentage`: `68`

## Missing Field Counts
- `amount`: `40`
- `groupName`: `9`

## Style Heuristics
- `messyMobileLike`: `1000`
- `cleanLike`: `0`
- `messyMobileLikeRate`: `1.0`

## Eval Subsets
- `clarification_response`: `94` rows, by split `{'test': 14, 'train': 64, 'validation': 16}`
- `destructive_or_edit`: `76` rows, by split `{'test': 6, 'train': 64, 'validation': 6}`
- `financial_answer`: `123` rows, by split `{'test': 21, 'train': 81, 'validation': 21}`
- `full_amount_splits`: `101` rows, by split `{'test': 18, 'train': 63, 'validation': 20}`
- `long_multi_step`: `154` rows, by split `{'test': 18, 'train': 119, 'validation': 17}`
- `lookup_navigation`: `149` rows, by split `{'test': 22, 'train': 106, 'validation': 21}`
- `messy_mobile_tts`: `1000` rows, by split `{'test': 150, 'train': 700, 'validation': 150}`
- `missing_fields`: `49` rows, by split `{'test': 4, 'train': 40, 'validation': 5}`
- `percentage_splits`: `68` rows, by split `{'test': 1, 'train': 65, 'validation': 2}`
- `settlements`: `38` rows, by split `{'test': 8, 'train': 26, 'validation': 4}`
- `unsupported_boundary`: `92` rows, by split `{'test': 18, 'train': 56, 'validation': 18}`
