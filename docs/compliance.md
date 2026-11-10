# Record checks and their sources

Checked 2026-11-10. This is an internal succession planning record system, not a recruitment service or an employment decision engine. A person assesses readiness and records the evidence. The software shows whether that evidence meets the configured conditions. It never ranks people by personal traits or makes appointments.

| Check | Source and meaning | Implementation |
|---|---|---|
| NZ-IPP1 | [NZ Privacy Commissioner, principle 1](https://www.privacy.org.nz/privacy-principles/1/): collect only necessary information for a lawful purpose. | People without a recorded purpose are flagged. A nonempty field does not prove necessity. |
| NZ-IPP3/3A | [Direct collection notice](https://www.privacy.org.nz/privacy-principles/3/) and [indirect collection notice](https://www.privacy.org.nz/privacy-principles/3a/). Principle 3A applies from May 2026, subject to its exceptions. | Missing or future notice dates are flagged. Review the actual notice, source and applicable exception. The date is evidence metadata, not proof that every notice requirement was met. |
| NZ-IPP8 | [Accuracy before use](https://www.privacy.org.nz/privacy-principles/8/). | Missing assessor, missing evidence, future dates and stale assessments are flagged. The 90-day freshness window is our configurable business policy, not a statutory deadline. |
| NZ-IPP9 | [Retention limits](https://www.privacy.org.nz/privacy-principles/9/). | Missing or expired retention-review dates are flagged. The organisation decides the necessary retention period and arranges approved disposal across records, history, exports and backups. No universal legal duration is encoded. |
| HOUSE-REVIEW | [SuccessionHR leadership continuity guidance](https://www.successionhr.com/resources-blog/succession-planning-for-leadership-continuity-building-a-leadership-bench-before-you-need-it) discusses regular reviews. | Role review dates are explicit. The 90-day policy is an operating choice. |

`npm run succession -- compliance` lists record exceptions. An empty list is not a legal compliance certificate. These checks cover selected NZ privacy principles only. Australian deployments require their own applicability review and documented rules before real staff records are loaded.

## Access and review

[Principle 5](https://www.privacy.org.nz/privacy-principles/5/) concerns secure storage. Keep this folder, generated reports and database within the authorised HR group. Tables have row-level security enabled with no public policies. The CLI runs as the trusted database owner. This is not individual-user authorisation or an identity system. Use separate database roles and reviewed access controls before a shared deployment. `--actor` is an operator-supplied audit label, not proof of identity.

[Principles 6 and 7](https://www.privacy.org.nz/privacy-principles/) concern access and correction. Review requests with the privacy officer. Export is a full administrative snapshot and must not be sent wholesale to an individual. Correct current records with the CLI; assess any request affecting audit history through an approved migration and retention procedure.

Do not put age, ethnicity, health, family circumstances or inferred retirement dates into readiness assessments. Record a role's target date only from an agreed business transition. `unavailable` is an availability fact, not a medical explanation. All demo people and the demo business are fictional.
