# Evidence and decisions

## Start from the actual project

Find the repository's instructions, existing plan/task/archive records and native
tools before choosing paths or formats. Existing task systems may own live status;
link their stable ids and export/snapshot terminal evidence for durable archiving.
Do not create a parallel project architecture or planning registry unnecessarily.

Read existing record-visibility and publication rules independently of how the
project was created. Locate the actual plan/task/handoff/archive destinations and
their canonical owner before writing; native entries may be derived local files.
Approved internal development docs can be inspected without being publishable.
Keep public files, indexes and contribution text free of references to internal
records. Resolve an unclear disclosure choice before exposing records; do not build
a new export architecture as part of routine planning.

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

## Requirements coverage before task design

Keep a compact coverage ledger: topic, evidence/answer, status and affected tasks.
For each topic below, record established/confirmed/delegated, pending, or not
applicable with a concrete reason. Do not equate two answered questions with
complete requirements. Reuse explicit answers and policies without re-asking.

| Topic | Required evidence or decision |
|---|---|
| Outcome and scope | Observable result, exclusions, planning-only versus separate implementation phase |
| Current behavior and architecture | Relevant implementation/contracts, ownership/dependency direction, baseline and preserved invariants |
| Changed behavior and interfaces | Inputs/outputs, failure cases, compatibility and caller impacts applicable to this change |
| Data and operations | Persistence/migration, permissions, environments and external effects when affected |
| Engineering constraints | Runtime/toolchain, dependency rules, document/file language and applicable code/document size policies, with source or explicit answer |
| Record visibility | Existing private/public destinations, permitted evidence and publication/link boundaries; consequential gaps resolved before writes |
| Acceptance | Observable task checks, overall integration checks, existing failures and unavailable validation |
| Execution and handoff | Inputs, dependencies, allowed writes, shared resources, rollback where relevant, readiness and stopping conditions |

If creating plan documents without an established language policy or prior answer,
ask their language; do not infer it from chat. If planned source changes depend on
missing file-size policy, ask whether limits apply (including no limit), their
scope and severity. Do not impose a default number or reopen settled project
policies. A narrow read-only archive audit need not invent new engineering policy.
Record unresolved choices as blockers on affected tasks; an optional draft plan
may retain them, but those tasks cannot be marked ready.

## Resolve questions in dependency order

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
