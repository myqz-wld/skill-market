# Evidence and decisions

## Start from the actual project

Find the repository's instructions, existing plan/task/archive records and native
tools before choosing paths or formats. Existing task systems may own live status;
link their stable ids and export/snapshot terminal evidence for durable archiving.
Do not create a parallel project architecture or planning registry unnecessarily.

Inspect the parts relevant to the change: module ownership, allowed dependency
directions, public APIs/configuration, data/migration ownership, build/deploy units
and regression checks. Cite repository-relative source paths and relevant symbols.
Use current contracts and code for current behavior; accepted unsuperseded ADRs
may remain authoritative despite age. A newer abandoned proposal is not authority.

Identify what the request changes and what must remain stable. Separate a requested
architectural change from accidental scope expansion. Reuse native naming, runtime,
package manager, testing and release conventions. Existing shortcomings outside the
change become bounded observations, not an automatic repository-wide cleanup.

## Evidence in parallel

Before each substantial investigation, look for two or more independent tracks.
Once locations are known, code inspection, test/baseline inspection and relevant
contract/history inspection can often run concurrently. Use batched tools for cheap
independent reads; agents are useful for genuinely independent reasoning or spikes.
Keep the lead doing useful separate work instead of delegating and immediately idling.

Each delegated investigation has a bounded question, allowed reads/writes, expected
evidence and stopping condition. Only use supported mechanisms with their real
authorization, capacity and costs. No tool discovery or plan entry grants access.
If concurrency is unsafe/unavailable or overhead exceeds the benefit, state the
specific reason briefly; do not invent independent tracks to fill a worker quota.

Do not parallelize a consumer before its required evidence exists. Investigations
that mutate shared databases, fixtures, ports or generated output are not independent
merely because their source directories differ. Keep experiments disposable and
within authorized scope. Read-only planning must not drift into feature coding.

## Decide without a questionnaire

Define the outcome, exclusions and observable success. Reuse established decisions.
Ask the next one to three related questions only when their answers materially
change scope, user-visible behavior, contracts, persistence/data handling,
permissions, cost or operational process. Do not ask the user to decide ordinary
file names, helper extraction or reversible local tool details.

Explain a recommended option with its tradeoff. The user can delegate a bounded
decision. Record consequential choices with id, answer, origin, evidence and affected
tasks; agent-chosen routine details are not user-confirmed policy. A useful compact
ledger is enough; there is no quota of decisions or approval checkpoints.

Compare alternatives only when there is a real alternative worth deciding. If
existing constraints already select the route, explain it instead of manufacturing
options. New evidence invalidates only affected decisions/tasks, not every prior
approval. Preserve a superseded decision's rationale and link its replacement.

## Probes and validation design

Run the smallest authorized investigation needed to settle a route-changing
assumption. Record the question, method, observed evidence, conclusion and limits.
A failed or unavailable probe is not a pass; plan a remaining validation task.
Do not add custom tooling solely to formalize a simple planning conversation.

Identify both task-level checks and the overall integration check. Plan compatibility,
rollback or data-transition checks only when relevant. Required external operations
remain pending until their own scope is authorized. Preserve baseline failures
separately so they cannot be mistaken for regressions or silently accepted away.
