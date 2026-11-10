<h1 align="center">Succession Planning for Claude Code</h1>

<p align="center">
  <strong>The open-source succession planning system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your SuccessionHR data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=successionhr">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/successionhr?utm_source=github&utm_medium=readme&utm_campaign=successionhr">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-successionhr">Instead of SuccessionHR</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Succession Planning for Claude Code covers the internal succession review, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and answers the cross-record questions below with rules you can inspect and change. SuccessionHR also offers readiness and risk reporting; this is a focused alternative, not a claim of feature parity.

SuccessionHR publishes US$11,954 per year for up to 250 key roles and US$36,618 per year for 501+ roles, with three-year terms billed upfront and separate onboarding. The entry tier is US$6,345 per year for up to 50 key roles. These are vendor list prices, not a verified invoice for a small NZ or AU firm. [Source: vendor pricing](https://www.successionhr.com/pricing), checked 2026-11-10.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=successionhr).

For an authorised HR operator and the owners of critical roles. Keep people, key roles, nominees, readiness evidence and development commitments together. Prepare a weekly review, test an absence scenario and draft the handover. This covers existing staff succession only, without recruiting applicants or making appointments.

A successor counts as usable only with confirmed interest, active availability, fresh evidence, a named assessor and no open blocking action. Those are review conditions, not a judgement about a person. All seeded records are fictional.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

No database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/succession-planning-for-claude-code.git
cd succession-planning-for-claude-code
npm install
npm run demo
```

Then open the folder in your coding agent and ask `/attention`. The demo finds two roles with no usable cover, an overdue development action and one person covering two roles. Try `npm run succession -- scenario P-102`.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| `/people` | List staff in the succession records |
| `/roles` | List the key roles and their owners |
| `/role` | Read one role, its evidence and development actions |
| `/successors` | Read nominations and which ones qualify as usable cover |
| `/coverage` | Review gaps and single-successor roles |
| `/attention` | Read the weekly exceptions |
| `/shared-successors` | Find people counted as cover for several roles |
| `/development` | Review development commitments and overdue actions |
| `/reviews-due` | List role reviews due soon and stale assessments |
| `/contingency` | Review upcoming handovers and missing active interim cover |
| `/compliance` | Review selected NZ privacy-record checks |
| `/activity` | Read the recent change history |
| `/stats` | Compare coverage gaps and overdue reviews by team |
| `/scenario` | Show the cover remaining if one person is unavailable |
| `/add-person` | Record an existing employee for internal succession planning |
| `/update-person` | Update availability or privacy-review metadata |
| `/add-role` | Record a key role and its review date |
| `/nominate` | Record a nomination without asserting readiness |
| `/assess` | Record a human assessment and evidence |
| `/add-action` | Add a concrete development commitment |
| `/complete-action` | Complete a development action with evidence |
| `/review-role` | Record a continuity review and the next date |
| `/log` | Record a role review note |
| `/draft-handover` | Draft a handover from the full role record |
| `/weekly-review` | Draft the Monday review from attention, coverage and development |
| `/import` | Import an agreed mapping of SuccessionHR records |
| `/export` | Export a full administrative snapshot |
| `/help` | List the CLI commands |
| `/customise` | Add a field or change a rule through a migration and tests. |
| `/new-view` | Add a private read-only report. |

## Instead of SuccessionHR

No native record-export format is publicly documented. Obtain an authorised copy, agree the mapping and run `npm run succession -- import successionhr --dir=./imports/mapped --actor="HR reviewer" --dry-run`. After reviewing the counts, remove `--dry-run`. The importer accepts four mapped CSV files atomically and refuses unknown columns. [Mapping and limits](docs/replace-successionhr.md). A one-day switch is conditional on receiving usable records and approving the mapping.

## Ten questions for your succession review

These commands answer the questions on the demo today. They combine the organisation's evidence, freshness rule, development work and availability. We have not asserted that a vendor cannot build equivalent reports.

1. "Which roles have nominees but no usable cover?" (`coverage`)
2. "Which apparently ready successors still have blocking work?" (`successors`)
3. "Which roles rely on the same ready person?" (`shared-successors`)
4. "What cover remains if Alex Reed becomes unavailable?" (`scenario P-102`)
5. "Which imminent handovers lack an active interim?" (`contingency`)
6. "Which stale assessments are still attached to key roles?" (`reviews-due`)
7. "Which overdue actions block a ready nomination?" (`development`)
8. "Which people need their retention purpose reviewed?" (`compliance`)
9. "Which team has the most uncovered roles and late reviews?" (`stats`)
10. "Who changed a readiness record and when?" (`activity`)

## Your first hour: ten things to ask for

1. Show the coverage gaps and explain why each nominee does not count.
2. Show which roles depend on Alex Reed.
3. Show the cover left if Alex Reed is unavailable.
4. List the overdue development actions and their owners.
5. Draft the Operations Lead handover from the evidence.
6. Produce the weekly review from attention, coverage and development.
7. Put our business name and logo in brand.json and render the paperwork.
8. Explain the mapped import and validate the sample files without writing.
9. Change the assessment freshness policy through a tested migration.
10. Add a private view showing only counts by team.

## Documents, privacy and verification

`npm run view` renders the week, the bench and privacy-review findings. `npm run docs` produces role handovers and successor development plans from the same records. Both use brand.json and write private HTML snapshots. `/draft-handover` and `/weekly-review` write Markdown to drafts. Nothing is sent.

`npm test` exercises every CLI command, rollback, ambiguous names, evidence gates, repeated imports, CSV edge cases, branded reports and privacy checks in a temporary database. CI runs on Windows and Linux, plus a disposable PostgreSQL service. The test never uses DATABASE_URL unless TEST_DATABASE_URL explicitly names an empty disposable test database.

Read [the compliance checks](docs/compliance.md) before real staff data. This is a trusted-operator base: the actor label is not authentication. The shared database needs reviewed individual access controls. Backups, generated reports and activity history also contain personal information. There is no automated promotion decision or bulk-message sender.

## Architecture

```
succession-planning-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Succession Planning for Claude Code for your business, migrates your SuccessionHR data, connects it to the rest of your tools, and runs it for you as part of **Omni by Enterprise DNA**, our managed Command Centre. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=successionhr)
- Read more: [enterprisedna.co/omni/instead-of/successionhr](https://enterprisedna.co/omni/instead-of/successionhr?utm_source=github&utm_medium=readme&utm_campaign=successionhr)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
