---
name: parallel-tasks
description: "Use when a task has 2+ independent tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. Also honor explicit requests to parallelize. Keep agents in the lead's family unless requested otherwise; decompose, route by complexity, run in parallel, then integrate and validate."
---

# Parallel Tasks

Use this skill when a request can be split into two or more self-contained tracks that parallel agents can execute concurrently. The lead decomposes the task, routes each subtask to a model tier, dispatches agents, and owns integration and validation.

## When To Use

Use this skill when any trigger applies and the lead can give each agent a self-contained brief:

- The task has at least 2 independent tracks with no ordering dependency and disjoint write sets, such as separate modules, files, packages, services, docs, tests, bug hypotheses, research questions, or audit/search areas.
- A broad inspection can be split safely, such as unused-code scans, repeated-pattern searches, compatibility checks, test triage, or comparing multiple implementation options.
- A multi-area implementation can be split by ownership boundary with disjoint write sets and a clear final integration step.
- Each subtask has enough context to run without reading the lead's conversation and can report concrete validation output.
- The user explicitly asks to parallelize, fan out, use parallel agents, or split work; treat this as a signal to check for decomposability against the structural criteria above.

Do not use for serial-dependent chains, tasks small enough for one agent, overlapping write sets that cannot be resolved before dispatch, or subtasks that need continuously shared state. If no parallel-agent mechanism is available in the current environment, keep the model routing below but run the subtasks serially in tier order (T1 first).

## Decomposition Rules

1. Split along module or file boundaries so write sets do not overlap. Resolve any overlap before dispatch, not after.
2. Write one brief per subtask: goal, input context, exact file paths, allowed write set, validation command, and expected output format.
3. Cross-cutting work such as shared types, integration glue, conflict resolution, and final whole-task validation stays with the lead; do not assign it to a parallel agent.
4. State the subtask's complexity tier in the brief so the agent knows the expected depth.

## Model Routing

Judge each subtask's complexity independently, choose the adapter family, then map the tier to an available model:

- Unless the user explicitly requests a different adapter or model family, keep spawned agents in the lead's family: Claude-family leads spawn Claude-family teammates, and GPT/Codex-family leads spawn GPT/Codex-family teammates.
- If the user explicitly requests a different family or model, use it when available; otherwise substitute by the availability rules below and record the substitution in the final report.
- Treat review-related subtasks as high-judgment work, not T4 mechanical/search/documentation work solely because they inspect, validate, or summarize. This covers review, audit, validation-review, adversarial review, plan review, prompt-asset review, and code-review subtasks; route them to the highest appropriate available tier for the review scope.

| Tier | Criteria | Default target |
|---|---|---|
| T1 | Cross-module architecture, concurrency, security boundaries, or deep debugging that needs design judgment | gpt-5.5 xhigh |
| T2 | Multi-file implementation, complex refactor, long-chain reasoning | opus xhigh |
| T3 | Single-module implementation or refactor with clear boundaries | gpt-5.5 medium |
| T4 | Mechanical edits, batch search, documentation, boilerplate tests | sonnet xhigh |

- Map the tier to the closest same-family model and reasoning-effort setting the dispatch mechanism exposes; when effort is not configurable, the model choice alone selects the tier.
- When the selected family's tier model is unavailable, substitute the nearest same-family tier that is available, preferring one tier up over one tier down, and record the substitution in the final report.
- When torn between two tiers, pick the higher one.

## Dispatch

- Dispatch through whatever parallel-agent mechanism the current environment provides, following that mechanism's own contract. Pass each subtask's adapter family, model, and reasoning effort through the mechanism's parameters where exposed; otherwise substitute per the routing rules above.
- Launch all independent subtasks in one batch. There is no fixed concurrency cap; size the batch to what the lead can integrate and the environment can run.
- Record each agent id together with its subtask and tier.
- Follow the environment's wait protocol: synchronous mechanisms return results in place; message-based mechanisms inject replies later. Send the work, end the current turn, and continue when replies arrive. Never busy-wait or poll.

## Integration And Validation

- The lead merges results, resolves conflicts, runs each subtask's planned validation, and runs one whole-task check at the end.
- Report per subtask: adapter family, tier, model actually used (including substitutions), outcome, and validation result.
- Do not accept an agent's success claim without its validation output.

## Failure Handling

- An agent fails or hits a usage limit: retry once on the same tier; on a second failure, run that subtask with the lead or the nearest available tier and note it in the report.
- Partial or missing results: never fabricate the gap; rerun the subtask or report it as open.
- Two agents touched the same file despite disjoint briefs: the lead re-reads both diffs and re-applies one of them manually, then tightens the decomposition next time.
