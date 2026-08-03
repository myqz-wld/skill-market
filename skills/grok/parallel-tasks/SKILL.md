---
name: parallel-tasks
description: "Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets that can run concurrently. This skill coordinates parallel execution; it does not discover or decompose a single task. Inventory dispatch capabilities first, select mechanisms that can enforce the resolved routing controls, obtain batch approval, then integrate and validate the results."
---

# Parallel Tasks

Use this skill when the lead already has two or more self-contained tasks or work tracks that can run concurrently. The lead confirms boundaries, selects an enforceable route for each task, and owns integration and validation. If the work is still one ambiguous request, create a concrete task list with boundaries and validation before using this skill.

## Parallel Execution Criteria

Use this skill only when the lead can give each agent a self-contained brief and the existing task set has at least one of these forms:

- 2+ identified tasks with no ordering dependency or overlapping write sets, such as separate modules, files, packages, services, docs, tests, bug hypotheses, research questions, or audit areas;
- separate read-only or mergeable inspection tracks, such as unused-code scans, pattern searches, compatibility checks, test triage, or option comparisons;
- a multi-area implementation already divided by ownership boundary, with explicit write areas and a final integration step;
- tasks that can run without the lead's conversation and return concrete validation output.

A request to parallelize triggers this check; it does not authorize inventing tasks or bypassing dependency and write-set checks.

Do not use this skill for one ambiguous request, a serial dependency chain, work small enough for one agent, unresolved write overlap, or tasks that need continuously shared state. If no parallel mechanism is available, retain the routing analysis and run tasks serially in tier order, starting with T1.

## Task Assignment Rules

1. Give each task a brief with its goal, relevant context, exact input paths, allowed write areas, validation command or standard, expected output, and tier.
2. Treat allowed write areas as hard limits; report required expansion instead of editing outside them.
3. Keep shared types, integration glue, conflict resolution, and final integrated validation with the lead.
4. Refine a brief that is not self-contained or run that task serially.

## Dispatch Envelope

Create one dispatch envelope per task and use it as the single source of truth through approval, execution, and reporting:

- **Brief:** goal, inputs, allowed writes, expected output, and validation.
- **Mechanism:** selected identifier, capability inventory, and any proposed fallback with its reason.
- **Controls:** requested and resolved tier; requested, resolved, and enforceable adapter, model, reasoning effort, context mode, team or messaging mode, filesystem mode, and wait or return behavior; and any proposed substitution with its reason.
- **Runtime:** pre-dispatch baseline when files are shared, handle or anchor, observed controls, substitutions actually applied, outcome, and validation result.

Brief, Mechanism, and Controls form the approval portion; record every proposed fallback or substitution there before approval. Append Runtime evidence only as execution progresses.

Append observed values only when returned metadata confirms them; use unknown when no truthful runtime claim is possible. Never present a requested or resolved value as actual without enforcement or observation.

## Dispatcher Capability Selection

1. Inventory every available parallel or session mechanism against all control fields in the Dispatch Envelope.
2. Resolve model controls through Model Routing and execution controls from the task brief and risk boundary.
3. Select a mechanism that enforces every required control. Exact adapter, model, reasoning, fresh-context, or isolation requirements need an interface that explicitly guarantees them.
4. Use an uncontrolled mechanism only when exact controls are unnecessary, no capable mechanism exists, or the user approves the limitation after seeing its effect.
5. Follow a mechanism's validation hint when it rejects a value. Re-present any material correction or fallback instead of silently switching to an uncontrolled route.
6. Prefer enforceability over same-turn waiting or a lighter dispatch path.

## Model Routing

Route each task independently by adapter family, then tier, concrete model, and reasoning effort:

- Default to the lead's family; change it only on user request or when no suitable same-family agent exists.
- Record an unavailable requested family or model and the proposed substitution before approval.
- Treat review as judgment work. Use capability no lower than T3 for review, audit, validation review, adversarial review, plan review, prompt-asset review, and code review; use T1 or T2 when it can affect architecture, security, concurrency, user-visible behavior, or a plan or release gate.

| Tier | Criteria | Reference target |
|---|---|---|
| T1 | Cross-module architecture, concurrency, security boundaries, or deep debugging that needs design judgment | fable-5 xhigh |
| T2 | Multi-file implementation, complex refactor, long-chain reasoning | gpt-5.6-sol xhigh |
| T3 | Single-module implementation or refactor with clear boundaries | gpt-5.6-terra xhigh |
| T4 | Mechanical edits, batch search, documentation, boilerplate tests | opus-4.8 xhigh |

Reference targets calibrate capability and effort; resolve cross-family targets to the closest same-family equivalent. If exact reasoning is required but unavailable, reject that mechanism; otherwise record it as uncontrolled or unknown. For an unavailable tier model, propose the nearest same-family tier, preferring one tier up over one tier down. Choose the higher tier when uncertain. Write every request, resolution, proposed substitution, and reason into the approval portion before approval.

## Dispatch Approval Gate

Present the complete approval portion of every envelope before the first dispatch of a batch and wait for explicit approval. A general request to parallelize, silence, timeout, rejection, or a revision request is not approval; revise and re-present or stop.

Approval covers only the presented batch. Reconfirm any material change to a brief, mechanism, control, enforceability claim, fallback, or validation. One transient-failure retry remains covered only when every approved field is unchanged. A bounded fallback is covered only when its mechanism and complete approval portion were approved in advance.

If no dedicated confirmation mechanism exists, ask in chat and end the turn. Never poll for approval.

## Dispatch

Dispatch only approved tasks and pass every enforceable control explicitly. There is no fixed concurrency cap; size the batch to what the lead and environment can handle. For shared filesystems, record dirty state and baselines for all allowed writes before dispatch; preserve pre-existing and unattributed changes.

Append each returned handle or anchor, observed control, substitution actually applied, and result to its envelope. Compare observed controls with the approved envelope and invoke Failure Handling on any conflict before integration.

Follow the selected wait contract. Synchronous mechanisms return in place. For message-based mechanisms, record returned handles or anchors; when progress depends on a reply, tell the user the work was sent and return control. Never busy-wait or poll.

## Integration And Validation

The lead integrates results, resolves conflicts, runs each task's validation, and runs one cross-task check such as a build, typecheck, targeted or full tests, or key-workflow verification. If that check cannot run, record the reason, substitute validation, and remaining risk.

Report the completed Dispatch Envelope for each task. Do not accept success without validation output, and never invent an actual runtime value.

## Failure Handling

- Retry once only for transient failures such as rate limits, crashes, or recoverable environment errors, and only with the exact approved envelope.
- For an unclear brief, missing context or capability, permission limit, or write overlap, fix the cause, choose an approved capable mechanism, or have the lead run the task.
- For a rejected routing value, follow the validation hint and obtain approval for any material change.
- For observed routing or execution conflicts, quarantine the output and attributable mutations until an exact-envelope retry succeeds or a changed envelope is approved. Keep isolated changes unmerged; on shared filesystems, freeze affected paths, capture the diff against the baseline, and separate task changes without reverting pre-existing or unattributed work.
- When rerouting, prefer the same family and tier, then the nearest same-family tier, and record the proposal before reapproval.
- For partial results, rerun, let the lead finish, or report the missing validation; never fabricate the gap.
- If agents still touch the same file, manually integrate valid parts, rerun affected and integrated validation, and tighten future briefs.
