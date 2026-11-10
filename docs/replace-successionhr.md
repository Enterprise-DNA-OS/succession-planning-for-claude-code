# Moving records from SuccessionHR

## What is verified

Checked 2026-11-10: [the product page](https://www.successionhr.com/our-software) documents key roles, successors, readiness, skills, development activity and reporting. It describes image export for org charts. It does **not** document a native CSV record-export layout. [The 2024 product update](https://www.successionhr.com/resources-blog/message-from-the-ceo) describes file imports, which is not proof of record exports.

Do not promise a direct native export or a one-day switch until the owner has obtained a machine-readable copy and agreed its mapping. Ask their account administrator or vendor for their role, people, nomination and development records. We have not tested an actual customer export. The fixtures here are synthetic examples of our mapping contract, not vendor examples.

## One import after mapping

1. Obtain authorised records. Keep the original and record the source of each row.
2. Map them into the four CSV files below. Keep stable source identifiers as codes. Export a spreadsheet sheet as UTF-8 CSV after mapping. If the vendor supplies images or PDF only, do not claim this importer reads them.
3. Validate without writing: `npm run succession -- import successionhr --dir=./imports/mapped --actor="HR reviewer" --dry-run --json`.
4. Remove `--dry-run` to import. All four files run in one transaction. A bad row rolls back everything. Re-importing updates matching codes and role/person pairs, without duplicating records.
5. Compare counts, nominees, assessment dates and open actions with the source before relying on the result. Run `coverage`, `compliance` and `reviews-due`. A person confirms each usable successor.

The examples folder has four files you can use with `--dir=./examples`. Dates are fictional fixture dates. Review windows can flag them as stale when run later.

## Mapping contract

### people.csv

`code, name, team, status, purpose, notice_date, retain_until, source`

### roles.csv

`code, name, team, owner, incumbent_code, interim_code, criticality, target_date, review_due, continuity_notes, source`

### successors.csv

`role_code, person_code, readiness, interest, assessed_on, evidence, assessor, source`

### development.csv

`code, role_code, person_code, task, owner, due, status, completed_on, evidence, blocking, source`


Every column must be present, even when optional values are blank. A header-only file means no rows of that kind. Unknown columns, duplicate columns, duplicate keys within a file, invalid dates and unresolved references fail the import. Keep any unmapped source fields separately until the owner approves their handling.

Optional `--mapping=./mapping.json` renames source headers. For example `{"people":{"Employee ID":"code","Employee Name":"name"}}`. It does not guess values or silently discard columns. Readiness values are `ready`, `within12`, `within24`, `unknown`; interest is `confirmed`, `unknown`, `declined`; people status is `active`, `unavailable`, `left`. Development status is `open` or `done`, and `blocking` is `true` or `false`. Convert source labels explicitly before import. Dates are ISO `YYYY-MM-DD`. Codes use letters, numbers, underscores or hyphens. Blank assessment dates remain unknown and cannot count as usable cover.

A complete action needs a completion date and evidence. The incumbent cannot nominate themselves as their own replacement. Retention and notice dates do not magically transfer legal validity: review the source notice and purpose.

## What remains outside this import

Attachments, org-chart images, surveys, historical readiness transitions, permissions, private conversations, integration configuration and vendor-specific grids are not imported. Record links to approved supporting evidence in the source and evidence fields. A screenshot cannot reconstruct the underlying records. Custom fields and other workflows need a reviewed migration before they can be imported.

`npm run succession -- export --dir=./exports/review-01` writes the four CSV files plus a JSON snapshot of all six business tables including audit history and settings. Use an empty output folder. CSV re-import transfers current business records, with new local UUIDs and new import audit entries. It does not restore original audit events or settings. Retain the snapshot and database backups for that purpose. Private files remain private.
