---
name: parallel-tasks
description: "Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets that can run concurrently. This skill coordinates parallel execution; it does not discover or decompose a single task. Inventory dispatch capabilities first, select mechanisms that can enforce the resolved routing controls, obtain batch approval, then integrate and validate the results."
---

# Parallel Tasks

Use this skill when the lead already has two or more self-contained tasks or work tracks that parallel agents can execute concurrently. The lead confirms task boundaries, inventories available dispatch capabilities, routes each task to a model tier, selects a mechanism that can enforce the resolved controls, and owns integration and validation. If the work is still one ambiguous request, first create a concrete task list with boundaries and validation for each task, then return to this skill.

## Parallel Execution Criteria

Use this skill only when the existing task set satisfies at least one criterion below and the lead can give each agent a self-contained task brief:

- The existing task set contains at least 2 already identified tasks or work tracks with no ordering dependency and no overlapping write sets, such as separate modules, files, packages, services, docs, tests, bug hypotheses, research questions, or audit areas.
- A broad inspection already has separate safe tracks whose outputs can be merged later, such as unused-code scans, repeated-pattern searches, compatibility checks, test triage, or comparing multiple implementation options.
- A multi-area implementation has already been separated by ownership boundary, with explicit allowed write areas, no overlapping write sets, and a clear final integration step.
- Each task can be assigned through a self-contained brief, so the agent can run without reading the lead's conversation and report concrete validation output.
- The user explicitly asks to parallelize, fan out, use parallel agents, or run multiple tasks in parallel; treat this as a signal to check the existing task set against these criteria, not as permission to invent tasks or bypass dependency and write-set checks.

Do not use this skill when any condition applies:

- The work is still one ambiguous request and no concrete task list exists.
- The tasks form a serial-dependent chain.
- The task set is small enough for one agent.
- Write sets overlap and cannot be resolved before dispatch.
- Tasks need continuously shared state.

If no parallel mechanism is available, keep the routing analysis but run the tasks serially in tier order, starting with T1.

## Task Assignment Rules

1. Before dispatch, write one assignment brief per task with the goal, relevant context, exact input paths, allowed write areas, validation command or standard, expected output format, and complexity tier.
2. Treat allowed write areas as hard limits. If a task needs a path outside its brief, the agent reports the needed scope expansion instead of editing it.
3. Keep cross-cutting work with the lead: shared types, integration glue, conflict resolution, and final integrated validation are not parallel task assignments.
4. If a task brief cannot be made self-contained, refine it with the lead or run it serially instead of dispatching it in parallel.

## Dispatcher Capability Selection

Before resolving and approving a dispatch batch:

1. Inventory every available parallel or session mechanism. Record whether each one supports adapter family, exact model, thinking or reasoning effort, context mode or forking, shared team or message anchors, isolated or shared filesystem behavior, and its wait and return contract.
2. Resolve each task's family, tier, model, and reasoning effort through Model Routing. Also resolve its context mode, team or messaging mode, shared or isolated filesystem mode, and wait and return behavior from the task brief and risk boundary.
3. Select a mechanism that can enforce every resolved routing and execution control. When exact adapter, model, reasoning, fresh-context, or isolation values are required, use a mechanism whose interface explicitly accepts and guarantees those values.
4. Treat an uncontrollable value as uncontrolled or unknown. Never present a requested or reference value as the actual runtime value when the mechanism cannot enforce or reveal it.
5. Use a mechanism without exact routing controls only when exact controls are not required, no capable mechanism exists, or the user explicitly approves the limitation after seeing its effect on the route.
6. If a capable mechanism rejects a routing value, follow its validation hint. If the corrected value or fallback changes the approved route materially, re-present it for approval instead of silently switching to an uncontrolled mechanism.
7. Prefer enforceability over convenience. Same-turn waiting or a lighter dispatch path is not a reason to choose a weaker mechanism.

Use four distinct labels in dispatch records: requested for the user's or reference target, resolved for the intended route and execution mode, enforceable for values guaranteed by the selected mechanism, and observed for values confirmed by returned metadata. Use unknown when no truthful runtime claim is possible.

## Model Routing

Route each task independently. Determine adapter family first, then tier, then concrete model and reasoning effort:

- Default to the lead's adapter family. Change families only when the user requests it or the current environment has no suitable same-family agent.
- If the user explicitly requests a different family or model, use it when available; otherwise record the requested route, proposed substitution, and reason before approval.
- Treat review-related tasks as judgment work. Use at least T3 for review, audit, validation-review, adversarial review, plan review, prompt-asset review, and code-review tasks; use T1 or T2 when the review can affect architecture, security, concurrency, user-visible behavior, or a plan or release gate.

| Tier | Criteria | Reference target |
|---|---|---|
| T1 | Cross-module architecture, concurrency, security boundaries, or deep debugging that needs design judgment | fable-5 xhigh |
| T2 | Multi-file implementation, complex refactor, long-chain reasoning | gpt-5.6-sol xhigh |
| T3 | Single-module implementation or refactor with clear boundaries | gpt-5.6-terra xhigh |
| T4 | Mechanical edits, batch search, documentation, boilerplate tests | opus-4.8 xhigh |

- Reference targets calibrate capability and effort; the resolved route still follows the family policy, using the closest same-family equivalent when the reference target is cross-family.
- Map the tier to the closest same-family model and reasoning setting exposed by a capable mechanism. If reasoning effort is not configurable and exact effort is required, reject that mechanism for the route; otherwise record the effort as uncontrolled or unknown.
- When the selected family's tier model is unavailable, propose the nearest available same-family tier, preferring one tier up over one tier down, and record the substitution for approval.
- When torn between two tiers, pick the higher one.
- Before dispatch, record the task's requested and resolved family, tier, model, reasoning effort, and any substitution. Do not label a resolved value as actual until its enforcement or observation supports that claim.

## Dispatch Approval Gate

- Before the first dispatch of each batch, present the concrete dispatch plan through the environment's user-confirmation mechanism.
- For every task, include its goal, allowed write areas, tier, selected mechanism identifier, requested and resolved adapter, model, reasoning effort, context mode, team or messaging mode, filesystem mode, and wait and return behavior; state whether each control is enforceable, any fallback reason, and validation.
- Wait for explicit user approval. A general request to parallelize, silence, timeout, rejection, or revision request does not approve a concrete batch. On revision, update and re-present the plan; otherwise stop without dispatching.
- Approval covers only the presented batch. Except for the retry rule below, reconfirm before dispatch when a task goal, allowed write area, tier, selected mechanism, routing value, enforceability, substitution, wait behavior, or validation changes materially.
- One retry for a transient failure remains covered only when it uses the exact approved mechanism, scope, tier, resolved adapter, model, reasoning effort, context mode, team or messaging mode, filesystem mode, wait and return behavior, enforceability claims, and validation. A bounded fallback is covered only when the approval names its mechanism and complete routing and execution envelope. Require new approval for every other mechanism, route, execution mode, capability, scope, or validation change.
- If the environment has no dedicated confirmation mechanism, ask in chat and end the turn until the user replies. Never poll for approval.

## Dispatch

- After the batch passes the Dispatch Approval Gate, dispatch only the approved independent tasks and pass every enforceable routing and execution control explicitly.
- Size each batch to what the lead can integrate and the environment can run; there is no fixed concurrency cap.
- Before a shared-filesystem dispatch, record the existing dirty state and a baseline for every allowed write area. Preserve pre-existing and unattributed changes.
- Record each dispatch handle or returned anchor with the task, mechanism identifier, requested and resolved route and execution mode, enforceable controls, observed metadata, and substitutions. Record unavailable runtime values as unknown.
- Compare every observed adapter, model, reasoning, context, messaging, and filesystem value with the approved envelope before accepting the result. If any observed value conflicts, quarantine the result and any task mutations, treat the dispatch as failed, and either retry through the exact approved envelope or obtain approval for a changed envelope before integration.
- In an isolated filesystem, keep quarantined changes unmerged. In a shared filesystem, freeze integration for affected paths, capture the task diff against the recorded baseline, and manually separate attributable task changes without reverting pre-existing or unattributed work.
- Follow the selected mechanism's wait contract. Synchronous mechanisms return results in place. For message-based mechanisms, record the returned handles or anchors; when the next useful step depends on a reply, tell the user the work was sent and return control. Never busy-wait or poll.

## Integration And Validation

- The lead merges results, resolves conflicts, runs each task's planned validation, and runs one integrated check that covers cross-task effects, such as a build, typecheck, full or targeted tests, key workflow verification, or another project-appropriate gate.
- If an integrated check cannot be run, record the reason, the substitute validation used, and the remaining risk.
- Report per task: dispatch handle or anchor, mechanism identifier, adapter family, tier, requested and resolved model and reasoning effort, enforceability or observed evidence, substitutions, outcome, and validation result. Use unknown instead of inventing an actual runtime value.
- Do not accept an agent's success claim without its validation output.

## Failure Handling

- Classify the failure before retrying. Retry once only for transient failures such as rate limits, crashes, or recoverable environment errors, and only within the exact retry envelope approved by the Dispatch Approval Gate.
- If the failure comes from an unclear assignment, missing context, unavailable capabilities, permission limits, or write-set overlap, fix the assignment brief, adjust the allowed write area, choose an approved capable mechanism, or have the lead run the task.
- If a routing value is rejected, follow the mechanism's validation hint. Re-present any material route or capability change for approval; never silently downgrade to an uncontrolled path.
- Treat observed routing or execution metadata that conflicts with the approved envelope as a dispatch failure. Keep its output and attributable filesystem mutations quarantined until an exact-envelope retry succeeds or the changed envelope receives explicit approval.
- When rerouting a failed task, prefer the same family and tier, then the nearest available same-family tier, and record the proposed substitution before any required reapproval.
- For partial or missing results, rerun the task, have the lead finish it, or report it as open with the missing validation. Never fabricate the gap.
- If agents touch the same file despite disjoint briefs, the lead re-reads both diffs, manually integrates only the valid parts, reruns affected task validation and the final integrated check, and tightens assignment checks next time.
