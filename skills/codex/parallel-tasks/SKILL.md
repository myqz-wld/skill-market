---
name: parallel-tasks
description: "Use when a complex task splits into two or more independent subtasks: decompose, route each subtask to a model tier by complexity (gpt-5.5 xhigh / opus xhigh / gpt-5.5 medium / sonnet xhigh), run subtasks on parallel agents, then integrate and validate results. Trigger on requests to parallelize work, fan out independent subtasks, or pick models by task difficulty."
---

# Parallel Tasks

Use this skill when one complex task contains two or more independent subtasks that parallel agents can execute concurrently. The lead decomposes the task, routes each subtask to a model tier, dispatches agents, and owns integration and validation.

## When To Use

- The task decomposes into at least 2 subtasks with disjoint write sets and no ordering dependency between them.
- Each subtask can be described in a self-contained brief that an agent can execute without reading the lead's conversation.

Do not use for serial-dependent chains, tasks small enough for one agent, or subtasks that need continuously shared state. If no parallel-agent mechanism is available in the current environment, keep the model routing below but run the subtasks serially in tier order (T1 first).

## Decomposition Rules

1. Split along module or file boundaries so write sets do not overlap. Resolve any overlap before dispatch, not after.
2. Write one brief per subtask: goal, input context, exact file paths, allowed write set, validation command, and expected output format.
3. Cross-cutting work — shared types, integration glue, conflict resolution, final whole-task validation — stays with the lead; do not assign it to a parallel agent.
4. State the subtask's complexity tier in the brief so the agent knows the expected depth.

## Model Routing

Judge each subtask's complexity independently (subtasks of one parent task may land in different tiers) and select the model:

| Tier | Criteria | Model |
|---|---|---|
| T1 | Cross-module architecture, concurrency, security boundaries, or deep debugging that needs design judgment | gpt-5.5 xhigh |
| T2 | Multi-file implementation, complex refactor, long-chain reasoning | opus xhigh |
| T3 | Single-module implementation or refactor with clear boundaries | gpt-5.5 medium |
| T4 | Mechanical edits, batch search, documentation, boilerplate tests | sonnet xhigh |

- Map the tier to the closest model and reasoning-effort setting the dispatch mechanism exposes; when effort is not configurable, the model choice alone selects the tier.
- When the tier's model is unavailable in the current environment, substitute the nearest tier that is available, preferring one tier up over one tier down, and record the substitution in the final report.
- When torn between two tiers, pick the higher one.

## Dispatch

- Dispatch through whatever parallel-agent mechanism the current environment provides, following that mechanism's own contract. Pass each subtask's model and reasoning effort through the mechanism's parameters where exposed; otherwise substitute per the routing rules above.
- Launch all independent subtasks in one batch. There is no fixed concurrency cap; size the batch to what the lead can integrate and the environment can run.
- Record each agent id together with its subtask and tier.
- Follow the environment's wait protocol: synchronous mechanisms return results in place; message-based mechanisms inject replies later — send the work, end the current turn, and continue when replies arrive. Never busy-wait or poll.

## Integration And Validation

- The lead merges results, resolves conflicts, runs each subtask's planned validation, and runs one whole-task check at the end.
- Report per subtask: tier, model actually used (including substitutions), outcome, and validation result.
- Do not accept an agent's success claim without its validation output.

## Failure Handling

- An agent fails or hits a usage limit: retry once on the same tier; on a second failure, run that subtask with the lead or the nearest available tier and note it in the report.
- Partial or missing results: never fabricate the gap; rerun the subtask or report it as open.
- Two agents touched the same file despite disjoint briefs: the lead re-reads both diffs and re-applies one of them manually, then tightens the decomposition next time.
