---
name: complex-work-planning
description: Use when the user explicitly requests this skill. When detecting a complex implementation request, architecture change, or other task that requires large-scale code changes before coding, ask the user whether to start this skill; if approved, create or update a durable plan, split work into tasks, record planning and handoff state, and prepare an isolated implementation-session handoff only after the plan is complete.
---

# Complex Work Planning

Once this skill is started by explicit user request or user approval, use it to plan complex implementation work, architecture changes, or other large-scale code changes that need durable planning, evidence gathering, risk isolation, or coordination across multiple planning sessions. Before locking the plan, brainstorm viable approaches, surface assumptions and tradeoffs, and ask focused clarifying questions when user intent or design choices are ambiguous. Create or update a durable plan that preserves decisions, evidence from code reading, documentation, tests, or spikes, task status, validation state, planning-session coordination state, and the next action outside chat.

## Boundary

This skill defines the planning method only. Follow the active environment or project contract for plan paths, task tools, worktrees, review, archive, and handoff mechanics.

## Workflow

1. **Clarify the request.** If the user's request is ambiguous, ask focused questions before planning. Define the goal, non-goals, scope boundaries, constraints, success checks, and decisions that need user confirmation.
2. **Explore the existing project.** When a project already exists, inspect the code, tests, docs, configuration, and runtime paths relevant to the request before proposing a design. Record the evidence, current behavior, constraints, and affected boundaries.
3. **Run a blindspot pass.** After project exploration, summarize likely historical traps, implicit conventions, boundary conditions, risky assumptions, missing references, and context the user may need to provide before route selection.
4. **Brainstorm technical routes.** Propose several viable approaches with different priorities, such as minimal change, architecture cleanup, migration-first, or risk-reduction. Explain each route's benefits, costs, risks, validation needs, and likely impact.
5. **Select and detail the route.** Help the user choose a route, then expand its implementation details. Confirm every core decision that affects architecture, public contracts, data shape, lifecycle, permissions, migration, rollback, or long-lived workflow behavior.
6. **Run targeted spikes for uncertainty.** For unverified assumptions, use subagent or session tools when the environment provides them, or run the smallest local script, command, or throwaway test yourself. Each spike must produce a short validation report with the question, method, command or file inspected, observed result, conclusion, and remaining risk.
7. **Write or update the plan.** Use the plan location and management rules from the active environment. Record the selected route, confirmed decisions, evidence, spike reports, unresolved risks, and validation strategy before splitting implementation work.
8. **Split the plan into tasks.** Derive independently executable technical tasks from the selected route, not vague work themes. Prefer tasks that can run in parallel with clear ownership, dependencies, write areas, concrete implementation steps, validation targets, and done criteria. When the environment has a task system, keep it synchronized with the plan.
9. **Review the final plan.** Use subagents, sessions, or review tools when the environment provides them to challenge the plan before implementation. Reviewers should probe hidden assumptions, missing project evidence, task dependencies, parallelization safety, validation gaps, rollback gaps, and handoff readiness. Convert findings into plan edits or focused user questions until every identified material issue is fixed, answered by the user, or recorded as accepted residual risk.
10. **Prepare isolation and hand off deliberately.** Hand off only after the plan is complete, reviewed, and approved through the user-facing or environment-required review process. Before transfer, create or enter the isolated implementation environment using the active environment's mechanism, then record its path, branch, status, accepted risks, validation state, and next implementation action in the plan and any task system.

## Plan Content

Include these fields in a durable plan:

- **Frontmatter or header:** plan id, status, created date, base commit/branch, and worktree path when the environment uses them.
- **Goal and invariants:** what must be true when the work is done.
- **Project evidence:** relevant code, tests, docs, runtime paths, current behavior, constraints, and affected boundaries discovered during exploration.
- **Blindspot pass:** historical traps, implicit conventions, boundary conditions, risky assumptions, missing references, and context the user may need to provide before route selection or implementation.
- **Route analysis and selected design:** brainstormed options with tradeoffs, the selected route, confirmed user decisions, and evidence that should not be re-litigated without new data.
- **Spike reports:** each uncertainty that was tested, the method used, observed result, conclusion, and remaining risk.
- **Task breakdown:** executable technical plans derived from the selected route, with owner, status, dependencies, write areas, concrete implementation steps, validation target, done criteria, parallelization notes, and task-system ids when available.
- **Review state:** reviewer or subagent findings, resolved questions, accepted residual risks, and remaining non-blocking caveats.
- **Progress, validation, and risks:** current task status, last completed planning step, validation state, blockers, dirty/workspace/worktree state, and what remains uncertain.
- **Implementation isolation:** isolated workspace, worktree, branch, or sandbox path and status prepared for implementation handoff.
- **Implementation-session instructions:** after each meaningful implementation task advances, update task status, last completed step, verification performed, blockers, dirty/workspace/worktree state, and the next implementation action.
- **Completion or abandonment requirements:** on completion, finalize by the project contract and record final validation; on abandonment, record why and clean up any isolated workspace by the environment's rules.
- **Implementation-session first action:** a complete instruction that lets a cold implementation session start immediately.

Use absolute paths in handoff instructions when another session will read files. For code assets inside an isolated worktree, point at the isolated path, not the main repository path.

If spike reports or task details become too large for the main plan, split them into separate files and keep a concise indexed summary with absolute paths in the plan.

## Handoff Rule

Before handing off to an implementation session after plan completion and review, create or enter the isolated implementation environment using the active environment's mechanism, then update the plan and any task system with current task status, confirmed decisions, accepted risks, validation state, blockers, dirty/workspace/worktree state, isolation path or branch, and absolute paths. The implementation-session first action must be executable without chat history. Name the plan path, isolated workspace path, first file or command to inspect, and next concrete edit or validation step. Do not rely on "continue from above" or unstated decisions.
