# Task decomposition, parallel batches and acceptance

## Choose the unit of work

Split by a deliverable with a clear input, output and independently checkable result.
Do this before choosing an executor. A complex single-agent job needs task documents
just as a multi-agent job does. Size alone is not the boundary: a risky migration
may need separate preparation/execution/verification tasks despite few lines of code.

Use separate tasks when outcomes have distinct dependencies, owners, verification,
write areas or handoffs. Keep coupled changes together when splitting would require
constant coordination or an unstable producer/consumer contract. Do not make a task
per file, per function or per arbitrary line count. One small bounded change can
use an inline task block with the same acceptance information.

Use the project's task locations and formats. Without an established convention,
propose one bundle under a suitable project-owned plan root:

```text
active/<plan-id>/
  plan.md
  tasks/
    T01-contract.md
    T02-producer.md
    T03-consumer.md
    T04-integration.md
  design.md                 # only for genuinely shared design
```

The example is not a required task count or dependency graph. Remove files with no
useful independent purpose. Keep one durable source per fact: the plan owns shared
scope/design decisions and the graph; a task owns its contract, execution report
and acceptance evidence. The index links tasks. Any copied status summary is a
dated snapshot, not another authoritative state to edit independently.

## Task contract

Each substantial task defines:

- Stable id/title, owner or unassigned role, current state and goal/non-goals.
- Prerequisites by task id and required accepted artifacts/baselines, not just
  "wait for the previous task".
- Exact inputs and selected shared references; interfaces/invariants to preserve.
- Allowed writes and exclusions, including generated outputs, shared data/ports
  and the report section of its own task file.
- Concrete steps sufficient to start, uncertainty needing a probe, and stopping
  conditions if an input or decision is missing.
- Acceptance criteria tied to observable checks, evidence to retain, and applicable
  rollback/recovery. Distinguish acceptance from unrelated cleanup.

During execution record actual changes, commands/results, blockers and outputs.
The assignment remains lead-owned after dispatch; the worker updates execution
evidence and readiness for review. Serialize edits to the task file: reconcile or
pause a running assignment before changing its contract. Task status has one owner
at a time; retain prior acceptance evidence when current readiness is invalidated.

Map the project's existing states to these meanings when necessary:
planned, ready, running, blocked, ready-for-review, accepted, needs-rework, cancelled.
Do not invent timestamps, executors or acceptance just to populate a template.

## Make parallelism executable

Build a dependency graph and identify the ready set. For each parallel batch,
record prerequisite artifacts, separate owners/write sets, shared-resource limits
and the join check. Check for cycles and missing task ids. Two tasks are parallel
only when their required inputs are available and their mutations do not conflict.

A contract task can unlock two implementations once the relevant interface and
generated artifacts have been accepted. If the producer's output remains unstable,
keep the consumer dependent or combine the work. "Frontend" and "backend" labels
alone do not prove independence.

Reserve shared files/generation/integration for one owner or a later integration
task. Separate worktrees reduce filesystem collisions but do not solve conflicting
interfaces. Re-check eligibility if a task changes a shared contract or its baseline;
pause/replan affected dependents, without throwing away unrelated completed work.

Use authorized tools/agents to run actual independent planning work concurrently
now. Implementation batches execute only within implementation authorization.
If only a plan was requested, deliver runnable batch definitions rather than launch
implementation sessions. If execution is authorized and mechanisms are available,
do not serialize a ready independent batch merely because the task list is ordered.

## Acceptance and handoff granularity

Workers report ready-for-review with evidence. The lead checks each criterion,
changed paths, contract/baseline and task output before marking accepted; inspect
or rerun relevant checks, not every unrelated suite. A worker's claim alone is
not acceptance. The same executor can carry out a separate verification step
when independent review is not required; state who actually verified what.

Failed or missing evidence yields needs-rework/blocked, with a specific next action.
Accepted tasks release their dependents only for the artifact/baseline actually
verified. A plan-level integration check remains necessary even when tasks passed.
Do not mark unexecuted tasks accepted because the plan itself was approved.

Unfinished work stays in its task record with next action and remaining checks.
On handoff, transmit that task and only its required shared inputs. An implementation
session should be able to start without reading all unrelated task reports.
