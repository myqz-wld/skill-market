{{Use the project's format. Task id, title, owner/unassigned role, state, parent
plan link and applicable baseline. The lead owns assignment changes; the worker
owns its execution report until the lead records acceptance.}}

# {{Task id}}: {{Deliverable}}

## Assignment

- Goal/non-goals: {{one coherent outcome and excluded work}}
- Dependencies: {{task ids, required accepted outputs and baseline/version}}
- Inputs: {{exact source/shared-design/decision references}}
- Allowed writes: {{files/areas plus this task's report section}}
- Exclusions/shared resources: {{unowned files, generators, ports, data, external effects}}
- Steps: {{first concrete action and enough structure to proceed}}
- Stop/report conditions: {{missing input, drift, new consequential decision}}

## Acceptance contract

| Criterion | Check | Evidence required |
|---|---|---|
| {{observable result}} | {{specific test/inspection}} | {{actual output or artifact identity}} |

{{Applicable rollback/recovery and existing failures. Omit irrelevant procedures.
Passing this task is distinct from passing plan-level integration.}}

## Execution report

{{Worker: actual changed paths, outputs/baselines, commands and observed results,
deviations, blockers, remaining checks and next action. Mark ready-for-review only
with evidence; do not mark your own claim accepted as the lead's decision.}}

## Acceptance and handoff

{{Lead/verifier: criterion-by-criterion result, evidence checked or rerun,
accepted/needs-rework/blocked and reason, accepted artifact baseline, allowed
dependent release or specific next action. State the actual verification actor;
do not invent independent review when the same executor verified its work.}}
