# Succession Planning for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| List staff in the succession records | `/people` |
| List the key roles and their owners | `/roles` |
| Read one role, its evidence and development actions | `/role` |
| Read nominations and which ones qualify as usable cover | `/successors` |
| Review gaps and single-successor roles | `/coverage` |
| Read the weekly exceptions | `/attention` |
| Find people counted as cover for several roles | `/shared-successors` |
| Review development commitments and overdue actions | `/development` |
| List role reviews due soon and stale assessments | `/reviews-due` |
| Review upcoming handovers and missing active interim cover | `/contingency` |
| Review selected NZ privacy-record checks | `/compliance` |
| Read the recent change history | `/activity` |
| Compare coverage gaps and overdue reviews by team | `/stats` |
| Show the cover remaining if one person is unavailable | `/scenario` |
| Record an existing employee for internal succession planning | `/add-person` |
| Update availability or privacy-review metadata | `/update-person` |
| Record a key role and its review date | `/add-role` |
| Record a nomination without asserting readiness | `/nominate` |
| Record a human assessment and evidence | `/assess` |
| Add a concrete development commitment | `/add-action` |
| Complete a development action with evidence | `/complete-action` |
| Record a continuity review and the next date | `/review-role` |
| Record a role review note | `/log` |
| Draft a handover from the full role record | `/draft-handover` |
| Draft the Monday review from attention, coverage and development | `/weekly-review` |
| Import an agreed mapping of SuccessionHR records | `/import` |
| Export a full administrative snapshot | `/export` |
| List the CLI commands | `/help` |
| Change a field or business policy | `/customise` |
| Add a read-only report | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run succession -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off SuccessionHR.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/successionhr

## People decisions and privacy

Use recorded facts only. Never select, score or promote a person from protected traits or inferred personal circumstances. This system tracks existing staff development and continuity, not recruitment. Human assessors own readiness ratings. Unknown interest, stale or missing evidence, unavailability and blocking actions prevent usable cover.

Run `/role` before changing a role. Use `--actor` on every mutation. This label records the operator's assertion, not authenticated identity. Keep exports, HTML and drafts within the authorised HR group. Review docs/compliance.md before real records. No full native SuccessionHR export has been verified: explain the mapping step. Never claim feature parity or legal compliance.
