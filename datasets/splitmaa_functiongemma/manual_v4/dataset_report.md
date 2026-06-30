# Splitmaa Manual v4 Dataset Report

## Summary
- Rows: `1400`
- Target rows before serious training: `2400`
- Target split: train `1700`, validation `350`, test `350`
- Remaining rows to target: `1000`
- Average input words: `11.02`
- Max input words: `39`
- Average operations: `1.2`
- Max operations: `4`

## Split Counts
- `test`: `210`
- `train`: `980`
- `validation`: `210`

## Workflow Counts
- `clarification_response`: `128`
- `entity_mutation`: `239`
- `expense_mutation`: `317`
- `financial_answer`: `171`
- `multi_step`: `210`
- `record_lookup`: `209`
- `unsupported`: `126`

## Operation Counts
- `add_expense`: `596`
- `add_group_member`: `64`
- `cancel_pending_workflow`: `20`
- `change_split`: `21`
- `compute_balance`: `57`
- `compute_date_window_total`: `36`
- `compute_summary`: `76`
- `compute_total`: `2`
- `create_contact`: `84`
- `create_group`: `244`
- `delete_expense`: `28`
- `edit_expense`: `35`
- `get_record_metadata`: `29`
- `list_records`: `5`
- `open_record`: `58`
- `provide_contact_details`: `13`
- `provide_missing_field`: `24`
- `remove_group_member`: `50`
- `search_records`: `99`
- `select_option`: `71`
- `settle_up`: `55`
- `show_previous`: `18`

## Split Type Counts
- `equal`: `394`
- `full_amount`: `128`
- `percentage`: `95`

## Missing Field Counts
- `amount`: `53`
- `groupName`: `9`
- `group_or_participants`: `3`

## Style Heuristics
- `messyMobileLike`: `1302`
- `cleanLike`: `98`
- `messyMobileLikeRate`: `0.93`

## Eval Subsets
- `clarification_response`: `128` rows, by split `{'test': 18, 'train': 90, 'validation': 20}`
- `destructive_or_edit`: `134` rows, by split `{'test': 17, 'train': 102, 'validation': 15}`
- `financial_answer`: `171` rows, by split `{'test': 29, 'train': 113, 'validation': 29}`
- `full_amount_splits`: `128` rows, by split `{'test': 22, 'train': 81, 'validation': 25}`
- `long_multi_step`: `210` rows, by split `{'test': 26, 'train': 159, 'validation': 25}`
- `lookup_navigation`: `209` rows, by split `{'test': 30, 'train': 150, 'validation': 29}`
- `messy_mobile_tts`: `1302` rows, by split `{'test': 199, 'train': 911, 'validation': 192}`
- `missing_fields`: `65` rows, by split `{'test': 4, 'train': 53, 'validation': 8}`
- `percentage_splits`: `95` rows, by split `{'test': 5, 'train': 86, 'validation': 4}`
- `settlements`: `55` rows, by split `{'test': 12, 'train': 35, 'validation': 8}`
- `unsupported_boundary`: `126` rows, by split `{'test': 22, 'train': 82, 'validation': 22}`
