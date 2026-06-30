# Splitmaa Manual v4 Dataset Report

## Summary
- Rows: `1500`
- Target rows before serious training: `2400`
- Target split: train `1700`, validation `350`, test `350`
- Remaining rows to target: `900`
- Average input words: `10.96`
- Max input words: `39`
- Average operations: `1.2`
- Max operations: `4`

## Split Counts
- `test`: `225`
- `train`: `1050`
- `validation`: `225`

## Workflow Counts
- `clarification_response`: `137`
- `entity_mutation`: `253`
- `expense_mutation`: `345`
- `financial_answer`: `183`
- `multi_step`: `222`
- `record_lookup`: `225`
- `unsupported`: `135`

## Operation Counts
- `add_expense`: `630`
- `add_group_member`: `68`
- `cancel_pending_workflow`: `21`
- `change_split`: `24`
- `compute_balance`: `61`
- `compute_date_window_total`: `40`
- `compute_summary`: `80`
- `compute_total`: `2`
- `create_contact`: `89`
- `create_group`: `257`
- `delete_expense`: `32`
- `edit_expense`: `41`
- `get_record_metadata`: `31`
- `list_records`: `6`
- `open_record`: `64`
- `provide_contact_details`: `14`
- `provide_missing_field`: `25`
- `remove_group_member`: `54`
- `search_records`: `105`
- `select_option`: `77`
- `settle_up`: `60`
- `show_previous`: `19`

## Split Type Counts
- `equal`: `416`
- `full_amount`: `135`
- `percentage`: `103`

## Missing Field Counts
- `amount`: `55`
- `groupName`: `9`
- `group_or_participants`: `4`

## Style Heuristics
- `messyMobileLike`: `1395`
- `cleanLike`: `105`
- `messyMobileLikeRate`: `0.93`

## Eval Subsets
- `clarification_response`: `137` rows, by split `{'test': 19, 'train': 97, 'validation': 21}`
- `destructive_or_edit`: `151` rows, by split `{'test': 20, 'train': 113, 'validation': 18}`
- `financial_answer`: `183` rows, by split `{'test': 31, 'train': 121, 'validation': 31}`
- `full_amount_splits`: `135` rows, by split `{'test': 23, 'train': 86, 'validation': 26}`
- `long_multi_step`: `222` rows, by split `{'test': 28, 'train': 167, 'validation': 27}`
- `lookup_navigation`: `225` rows, by split `{'test': 32, 'train': 162, 'validation': 31}`
- `messy_mobile_tts`: `1395` rows, by split `{'test': 212, 'train': 978, 'validation': 205}`
- `missing_fields`: `68` rows, by split `{'test': 4, 'train': 56, 'validation': 8}`
- `percentage_splits`: `103` rows, by split `{'test': 6, 'train': 92, 'validation': 5}`
- `settlements`: `60` rows, by split `{'test': 13, 'train': 38, 'validation': 9}`
- `unsupported_boundary`: `135` rows, by split `{'test': 23, 'train': 89, 'validation': 23}`
