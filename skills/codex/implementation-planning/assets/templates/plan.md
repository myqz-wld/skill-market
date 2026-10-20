{{Use the project's record format. Include stable plan id, title, lifecycle state,
created/updated information and baseline commit or identified snapshot. Do not
invent values. Use repository-relative paths in this bundle.}}

# {{Change title}}

## Goal, scope and architecture

{{Requested outcome, non-goals, existing architecture/contract references,
invariants to preserve and any explicitly resolved architectural delta.}}

## Evidence and consequential decisions

{{Current behavior and relevant source/symbols; meaningful risks/probe results.
Record important decision ids, answer/origin, evidence and affected tasks.
Routine reversible defaults need only a brief note. Link shared design if needed.}}

## Task index and dependencies

| Task | Outcome | Record | Prerequisites | Owner/write area |
|---|---|---|---|---|
| {{stable id}} | {{independently verifiable result}} | {{relative link}} | {{task ids + accepted input}} | {{owner and area}} |

{{This table locates authoritative task records. Avoid duplicating live status;
if a summary is useful, label it with its snapshot date/source. Include an inline
task contract instead only for one genuinely small bounded change.}}

## Parallel execution

{{Dependency graph, ready batch and later conditional batches. For each batch:
stable inputs, disjoint allowed writes/shared resources, owners and join check.
Record actual planning concurrency used, or the concrete reason work was serial.
Do not launch implementation merely because these batches are planned.}}

## Overall acceptance and risks

{{Task checks plus integration/compatibility validation, relevant rollback/recovery,
known baseline failures and residual uncertainty. State what has actually run.}}

## Resume and handoff

{{Next ready task, current baseline/isolation state if used, first file/command,
next action and unresolved blockers. Existing authorization and external-effect
limits remain explicit. A ready plan is not completed implementation.}}

## Closure and archive

{{Chosen archive convention and eventual relative closure/locator link. Until
terminal closure, leave the plan ready/executing as appropriate. At closure
retain the complete task/evidence bundle and its baseline for future audit.}}
