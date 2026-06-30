# Splitmaa Manual v4 Dataset Report

## Summary
- Rows: `2400`
- Target rows before serious training: `2400`
- Target split: train `1700`, validation `350`, test `350`
- Remaining rows to target: `0`
- Average input words: `10.73`
- Max input words: `39`
- Average operations: `1.17`
- Max operations: `4`

## Split Counts
- `test`: `350`
- `train`: `1700`
- `validation`: `350`

## Workflow Counts
- `clarification_response`: `242`
- `entity_mutation`: `399`
- `expense_mutation`: `535`
- `financial_answer`: `309`
- `multi_step`: `347`
- `record_lookup`: `354`
- `unsupported`: `214`

## Operation Counts
- `add_expense`: `870`
- `add_group_member`: `106`
- `cancel_pending_workflow`: `40`
- `change_split`: `54`
- `compute_balance`: `112`
- `compute_date_window_total`: `84`
- `compute_summary`: `110`
- `compute_total`: `3`
- `create_contact`: `134`
- `create_group`: `412`
- `delete_expense`: `62`
- `edit_expense`: `81`
- `get_record_metadata`: `50`
- `list_records`: `19`
- `open_record`: `106`
- `provide_contact_details`: `27`
- `provide_missing_field`: `60`
- `remove_group_member`: `88`
- `search_records`: `145`
- `select_option`: `116`
- `settle_up`: `99`
- `show_previous`: `34`

## Split Type Counts
- `equal`: `575`
- `full_amount`: `185`
- `percentage`: `164`

## Missing Field Counts
- `amount`: `62`
- `contact_details`: `2`
- `currency`: `2`
- `email`: `2`
- `groupName`: `9`
- `group_or_participants`: `6`

## Style Heuristics
- `messyMobileLike`: `2286`
- `cleanLike`: `114`
- `messyMobileLikeRate`: `0.9525`

## Eval Subsets
- `clarification_response`: `242` rows, by split `{'test': 35, 'train': 172, 'validation': 35}`
- `destructive_or_edit`: `285` rows, by split `{'test': 43, 'train': 204, 'validation': 38}`
- `financial_answer`: `309` rows, by split `{'test': 50, 'train': 209, 'validation': 50}`
- `full_amount_splits`: `185` rows, by split `{'test': 29, 'train': 125, 'validation': 31}`
- `long_multi_step`: `332` rows, by split `{'test': 39, 'train': 253, 'validation': 40}`
- `lookup_navigation`: `354` rows, by split `{'test': 50, 'train': 254, 'validation': 50}`
- `messy_mobile_tts`: `2286` rows, by split `{'test': 335, 'train': 1623, 'validation': 328}`
- `missing_fields`: `83` rows, by split `{'test': 4, 'train': 71, 'validation': 8}`
- `percentage_splits`: `164` rows, by split `{'test': 14, 'train': 137, 'validation': 13}`
- `settlements`: `99` rows, by split `{'test': 21, 'train': 62, 'validation': 16}`
- `unsupported_boundary`: `214` rows, by split `{'test': 30, 'train': 154, 'validation': 30}`
