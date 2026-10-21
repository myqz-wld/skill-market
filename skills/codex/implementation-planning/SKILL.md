---
name: implementation-planning
description: "Turn substantial code changes into architecture-aware implementation plans with independently verifiable tasks, safe parallel batches and clear handoffs. Use for planning features, fixes, refactors or migrations, and for resuming, checking or archiving those plans. Reuse existing project conventions."
---

# Implementation Planning for Codex

Produce a plan another implementation session can execute and verify without
reconstructing the conversation. Support features, fixes, refactors and migrations
within the project's actual architecture. Also support plan resumption, closure,
archiving and historical/current audits.

This skill owns planning and record lifecycle, not automatic product implementation.
Reuse the user's actual authorization: planning alone does not authorize code
changes, delegation, worktree creation or external effects. Deliver the plan and
handoff first, then stop this skill. Never automatically execute ready tasks.
Separate any already-authorized implementation into its own phase; reuse that
authorization there without treating this planning skill as an execution trigger.

Use Codex's available file/patch, execution and collaboration tools under
their live contracts. Keep native child agents distinct from external sessions.

## 1. Establish the change and project contract

Before a new plan or its first substantive question batch, read references/planning.md,
references/tasks.md, references/lifecycle.md and assets/templates/plan.md in full.
Read assets/templates/task.md before decomposing substantial execution units.
For resume/closure/audit, read lifecycle.md and the relevant template plus the
existing plan, affected task records and baseline evidence first; do not restart
a new-project interview. Read model-boundaries.md before dependent decisions if
LLM calls are in scope. A listing/search excerpt/truncated read is insufficient:
read missing ranges and record paths plus the constraints learned. Missing
required resources block dependent conclusions, not independent inspection.

Reuse the user's goal, scope and existing decisions.
Locate applicable instructions, module boundaries, contracts, runtime/task tooling,
tests, architecture decisions and plan/archive conventions. Start from known paths;
expand inspection only as needed. No particular manifest, directory layout,
document format, helper script or other skill is a prerequisite.
Read the project's own record visibility, source/output ownership and publication
rules before writing. Keep plans, task evidence, handoffs and archives in the selected
locations; do not expose internal records through public files or links. Follow the
project's actual commands without introducing a dependency on another skill.

Preserve established architecture. If the requested change conflicts with it,
identify the conflict and resolve the architectural delta explicitly; do not
redesign the repository merely to fit this planning method.

For an existing plan, read its summary, referenced task states and latest relevant
evidence first. For a review/archive request, follow `references/lifecycle.md`
instead of restarting a new planning interview.

## 2. Gather evidence and resolve only consequential choices

Identify independent investigations early: relevant implementation, regression
coverage, contracts/history or a bounded technical uncertainty. Run independent
authorized reads/tool calls concurrently when supported; use bounded agents for
independent judgment when their scope and runtime authorization allow it.
Do not describe an investigation as parallel when it was performed sequentially.

Use the requirements coverage in references/planning.md before choosing questions.
Resolve all applicable topics, not just the first few that come to mind. Ask related
unanswered questions in batches; continue until dependencies are settled. Reuse
explicit project language and engineering constraints; when relevant policies are
missing, ask rather than silently inventing them. Routine filenames remain local
choices. A new finding reopens only decisions it actually changes.

Use a minimal spike only for an uncertainty that could change the route. Record
what was inspected/run, what happened and what remains unknown. Ordinary exact
operations use tools/code; read `references/model-boundaries.md` only when the
proposed product/workflow contains LLM calls.

## 3. Decompose into executable and independently accepted tasks

Read `references/tasks.md`. Decomposition is based on outcomes and dependencies,
not on whether work will be delegated. Multiple independently testable outcomes,
handoffs, owners or coordination needs require task documents even for one executor.
A single narrow outcome may stay in one compact plan.

Use `assets/templates/plan.md` for the shared goal, architecture evidence, decisions,
task index, dependency graph, parallel batches and overall acceptance. Use
`assets/templates/task.md` for each substantial execution unit. Add shared
`assets/templates/design.md` only when several tasks need the same design.
Adapt templates to the project's existing format; remove inapplicable sections.

At planning time, evaluate real concurrency: prerequisites, input stability,
write ownership, shared runtime resources and a join/validation point. Mark the
ready batch, the conditional later batches and any concrete reason for serial work.
Keep coupled producers/consumers together or order them around a verified boundary.

## 4. Check readiness and hand off

Verify complete applicable requirements coverage, evidence reads, architecture
fit, resolved choices, task dependencies, inputs,
write sets, acceptance checks, rollback needs and the first executable action.
Task readiness is not task completion. Inspect risk with a separate reviewer only
when useful and available under the actual environment's review contract.

Resolve any remaining consequential decision or required final-plan approval;
do not manufacture another confirmation when the relevant scope is already approved.
Prepare isolation only when the project/user requires it and the runtime supports
it. A finished plan can be handed off in the existing workspace.

Prepare the task-file handoff with exact shared references, baseline and runtime
bootstrap fields. Do not dispatch implementation workers from a planning-only
request. In a separately authorized execution phase, workers record evidence and
the lead checks acceptance before releasing dependents. Follow
references/lifecycle.md for record state changes and handoff mechanics.

## 5. Close, archive and support later verification

When the work reaches a truthful terminal outcome, record
`assets/templates/closure.md` and archive the complete bundle according to project
conventions. Planning-only delivery normally stays ready for implementation;
archiving it does not mean the code was implemented.

For later review use `assets/templates/audit.md`: identify the archived baseline,
scope and evidence, then distinguish what was verified then from what is verified
now. Preserve the original record and link any new finding or follow-up plan.
Report completed, remaining and unverified work without upgrading historical
evidence to a current pass.
