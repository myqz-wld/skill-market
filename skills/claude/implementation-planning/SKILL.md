---
name: implementation-planning
description: "Turn substantial code changes into architecture-aware implementation plans with independently verifiable tasks, safe parallel batches and clear handoffs. Use for planning features, fixes, refactors or migrations, and for resuming, checking or archiving those plans. Reuse existing project conventions."
---

# Implementation Planning for Claude

Produce a plan another implementation session can execute and verify without
reconstructing the conversation. Support features, fixes, refactors and migrations
within the project's actual architecture. Also support plan resumption, closure,
archiving and historical/current audits.

This skill owns planning and record lifecycle, not automatic product implementation.
Reuse the user's actual authorization: planning alone does not authorize code
changes, delegation, worktree creation or external effects. If execution is already
authorized, hand the ready tasks to the existing execution workflow without asking
for the same permission again.

Use Claude Code's available Read/Edit/Write, execution and agent tools under
their live contracts. Preserve native permissions and the host's delegation rules.

## 1. Establish the change and project contract

Read `references/planning.md`. Reuse the user's goal, scope and existing decisions.
Locate applicable instructions, module boundaries, contracts, runtime/task tooling,
tests, architecture decisions and plan/archive conventions. Start from known paths;
expand inspection only as needed. No particular manifest, directory layout,
document format, helper script or other skill is a prerequisite.

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

Ask only unresolved decisions that materially affect scope, behavior, compatibility,
data, permissions, cost or operating process. Choose routine reversible details
and briefly state them. Avoid extra activation questions or repeated approval
checkpoints. A new finding reopens only decisions it actually changes.

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

Verify architecture fit, resolved consequential choices, task dependencies, inputs,
write sets, acceptance checks, rollback needs and the first executable action.
Task readiness is not task completion. Inspect risk with a separate reviewer only
when useful and available under the actual environment's review contract.

Resolve any remaining consequential decision or required final-plan approval;
do not manufacture another confirmation when the relevant scope is already approved.
Prepare isolation only when the project/user requires it and the runtime supports
it. A finished plan can be handed off in the existing workspace.

Dispatch the task file plus its exact shared references, baseline and runtime
bootstrap fields. Do not copy the entire plan into every worker prompt. Workers
record outcomes/evidence; the lead checks acceptance before releasing dependents.
Follow `references/lifecycle.md` for resume, state changes and handoff mechanics.

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
