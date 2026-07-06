---
name: parallel-tasks
description: "Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. This skill coordinates parallel execution; it does not discover or decompose a single task into tasks. Keep agents in the lead's family unless requested otherwise; assign, route by complexity, run in parallel, then integrate and validate."
---

# Parallel Tasks

Use this skill when the lead already has two or more self-contained tasks or work tracks that parallel agents can execute concurrently. The lead confirms task boundaries, routes each task to a model tier, dispatches agents, and owns integration and validation. If the work is still one ambiguous request, first create a concrete task list with boundaries and validation for each task, then return to this skill to coordinate parallel execution.

## Parallel Execution Criteria

Use this skill only when the existing task set satisfies at least one criterion below and the lead can give each agent a self-contained task brief:

- The existing task set contains at least 2 already identified tasks or work tracks. They must have no ordering dependency and no overlapping write sets, such as separate modules, files, packages, services, docs, tests, bug hypotheses, research questions, or audit/search areas.
- A broad inspection already has separate safe tracks whose outputs can be merged later, such as unused-code scans, repeated-pattern searches, compatibility checks, test triage, or comparing multiple implementation options.
- A multi-area implementation has already been separated by ownership boundary, with explicit allowed write areas for each task, no overlapping write sets, and a clear final integration step.
- Each task can be assigned through a self-contained brief, so the agent can run without reading the lead's conversation and report concrete validation output.
- The user explicitly asks to parallelize, fan out, use parallel agents, or run multiple tasks in parallel; treat this as a signal to check the existing task set against these criteria, not as permission to invent tasks or bypass dependency and write-set checks.

Do not use this skill when any condition applies:

- The work is still one ambiguous request and no concrete task list exists.
- The tasks form a serial-dependent chain.
- The task set is small enough for one agent.
- Write sets overlap and cannot be resolved before dispatch.
- Tasks need continuously shared state.

If no parallel-agent mechanism is available in the current environment, keep the model routing below but run the tasks serially in tier order (T1 first).

## Task Assignment Rules

1. Before dispatch, write one assignment brief per task with the goal, relevant context, exact input paths, allowed write areas, validation command or standard, expected output format, and complexity tier.
2. Treat allowed write areas as hard limits. If a task needs a path outside its brief, the agent reports the needed scope expansion instead of editing it.
3. Keep cross-cutting work with the lead: shared types, integration glue, conflict resolution, and final integrated validation are not parallel task assignments.
4. If a task brief cannot be made self-contained, refine it with the lead or run it serially instead of dispatching it in parallel.

## Model Routing

Route each task independently. Determine adapter family first, then tier, then concrete model and reasoning effort:

- Default to the lead's adapter family: Claude-family leads spawn Claude-family teammates, and GPT/Codex-family leads spawn GPT/Codex-family teammates. Change families only when the user requests it or the current environment has no suitable same-family agent.
- If the user explicitly requests a different family or model, use it when available; otherwise substitute by the availability rules below and record the requested target, actual target, and reason in the dispatch record and final report.
- Treat review-related tasks as judgment work. Use at least T3 for review, audit, validation-review, adversarial review, plan review, prompt-asset review, and code-review tasks; use T1 or T2 when the review can affect architecture, security, concurrency, user-visible behavior, or a plan/release gate.

| Tier | Criteria | Reference target |
|---|---|---|
| T1 | Cross-module architecture, concurrency, security boundaries, or deep debugging that needs design judgment | gpt-5.5 xhigh |
| T2 | Multi-file implementation, complex refactor, long-chain reasoning | opus xhigh |
| T3 | Single-module implementation or refactor with clear boundaries | gpt-5.5 medium |
| T4 | Mechanical edits, batch search, documentation, boilerplate tests | sonnet xhigh |

- Reference targets calibrate capability and effort; actual dispatch still follows the family policy above, using the closest same-family equivalent when the reference target is cross-family.
- Map the tier to the closest same-family model and reasoning-effort setting the dispatch mechanism exposes; when effort is not configurable, the model choice alone selects the tier.
- When the selected family's tier model is unavailable, substitute the nearest same-family tier that is available, preferring one tier up over one tier down, and record the substitution in the dispatch record and final report.
- When torn between two tiers, pick the higher one.
- After routing, record the task's resolved family, tier, target model, reasoning effort when available, and any substitution before dispatch.

## Dispatch

- Dispatch through whatever parallel-agent mechanism the current environment provides, following that mechanism's own contract. Pass each task's adapter family, model, and reasoning effort through the mechanism's parameters where exposed; otherwise substitute per the routing rules above.
- Launch the selected independent task batch together. There is no fixed concurrency cap; size each batch to what the lead can integrate and the environment can run.
- Record each dispatch handle or agent id together with the task, resolved family, tier, target model, reasoning effort when available, and any substitution.
- Follow the environment's wait protocol: synchronous mechanisms return results in place; message-based mechanisms inject replies later. Send the work, end the current turn, and continue when replies arrive. Never busy-wait or poll.

## Integration And Validation

- The lead merges results, resolves conflicts, runs each task's planned validation, and runs one integrated check at the end that covers cross-task effects, such as build, typecheck, full or targeted tests, key workflow verification, or another project-appropriate gate.
- If an integrated check cannot be run, record the reason, the substitute validation used, and the remaining risk.
- Report per task: dispatch handle or agent id, adapter family, tier, model actually used, reasoning effort when available, substitutions, outcome, and validation result.
- Do not accept an agent's success claim without its validation output.

## Failure Handling

- Classify the failure before retrying. Retry once on the same family and tier only for transient failures such as rate limits, crashes, or recoverable environment errors.
- If the failure comes from an unclear assignment, missing context, unavailable tools, permission limits, or write-set overlap, fix the assignment brief, adjust the allowed write area, or have the lead run the task instead of repeating the same dispatch.
- When rerouting a failed task, use the Model Routing substitution rules: prefer same family and same tier, then the nearest available same-family tier, and record the substitution in the dispatch record and final report.
- Partial or missing results: never fabricate the gap; rerun the task, have the lead finish it, or report it as open with the missing validation.
- If agents touch the same file despite disjoint briefs, the lead re-reads both diffs, manually integrates only the valid parts, reruns affected task validation and the final integrated check, and tightens assignment checks next time.
