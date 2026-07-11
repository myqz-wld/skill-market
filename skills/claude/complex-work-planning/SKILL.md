---
name: complex-work-planning
description: "Use when the user explicitly requests this skill. When a complex implementation, architecture change, or other large-scale code change is detected before coding, ask whether to start it. Once approved, create a durable plan with staged confirmation of user-owned decisions, split work into tasks, and prepare an isolated implementation handoff only after the plan is complete."
---

# Complex Work Planning

Once this skill is started by explicit user request or user approval, use it to plan complex implementation work, architecture changes, or other large-scale code changes that need durable planning, evidence gathering, risk isolation, or coordination across multiple planning sessions. Before selecting a route, surface assumptions and tradeoffs, classify material decisions, and resolve every user-owned choice through staged interviews. Create or update a durable plan that preserves the decision ledger, evidence from code reading, documentation, tests, or spikes, task status, validation state, planning-session coordination state, and the next action outside chat.

## Boundary

This skill defines the planning method only. Follow the active environment or project contract for plan paths, task tools, worktrees, review, archive, and handoff mechanics.

## Workflow

1. **Clarify the request.** Define the goal, non-goals, scope boundaries, constraints, success checks, and candidate decisions without silently filling material product gaps.
2. **Explore the existing project.** When a project already exists, inspect the code, tests, docs, configuration, and runtime paths relevant to the request. Record the evidence, current behavior, constraints, and affected boundaries.
3. **Run a blindspot pass.** Summarize likely historical traps, implicit conventions, boundary conditions, risky assumptions, missing references, and context the user may need to provide.
4. **Build the decision ledger.** After exploration and the blindspot pass, record and classify every material choice using the Decision Interview Protocol.
5. **Brainstorm technical routes.** Propose viable approaches with different priorities, such as minimal change, architecture cleanup, migration-first, or risk-reduction. Explain each route's benefits, costs, risks, validation needs, and likely impact.
6. **Pass Checkpoint A and select the route.** Resolve every material user-owned decision that affects route selection, then help the user choose a route and expand its implementation details.
7. **Run targeted spikes for uncertainty.** For unverified assumptions, use the smallest available investigation that can answer the question. Each spike must produce a short validation report with the question, method, command or file inspected, observed result, conclusion, and remaining risk. Run Checkpoint B whenever a spike or review exposes a new user-owned choice.
8. **Write or update the plan continuously.** Record each confirmed, constrained, or delegated decision immediately. Add the selected route, evidence, spike reports, unresolved engineering risks, and validation strategy before splitting implementation work.
9. **Split the plan into tasks.** Derive independently executable technical tasks from the selected route, not vague work themes. Give each task clear ownership, dependencies, write areas, implementation steps, validation targets, and done criteria. Keep any environment task system synchronized with the plan.
10. **Review the final plan.** Pass Checkpoint C before final review. Challenge hidden assumptions, missing project evidence, task dependencies, parallelization safety, validation gaps, rollback gaps, and handoff readiness. If review creates a user-owned choice, return to Checkpoint B, update the ledger, and pass Checkpoint C again before requesting final approval.
11. **Prepare isolation and hand off deliberately.** Hand off only after the plan is complete, reviewed, and approved through the user-facing or environment-required process. Before transfer, create or enter the isolated implementation environment using the active environment's mechanism, then record its path, branch, status, accepted risks, validation state, and next implementation action in the plan and any task system.

## Decision Interview Protocol

Maintain a durable decision ledger. Give every item:

- a stable decision id;
- the question or choice and its impact;
- an owner: user, project constraint, or engineering;
- the available options with the recommended default first;
- the evidence or source;
- a status: unresolved, confirmed, constrained, or delegated.

Treat a material choice as user-owned unless the user or an explicit project contract already fixes it when it affects:

- scope or exclusions;
- user-visible behavior or workflow;
- a public API or configuration surface;
- provider, model, or settings behavior;
- permissions, security, data disclosure, or code-execution capability;
- persistence, retention, deletion, migration, downgrade, backup, or rollback policy;
- operational cost or external side effects.

Use project constraint only when a cited contract or project artifact fixes the choice. Use engineering only for implementation choices that do not change a user-owned boundary. Do not infer a preferred product policy from technical convenience.

Ask 1-3 related, next-step-blocking decisions per interaction. Put the recommended option first and explain the tradeoff. If more than three choices must be understood together to preserve context, present them as one structured decision set rather than splitting them mechanically. Use a dedicated user-input mechanism when available; otherwise ask in chat and stop until the user answers. Record each answer in the durable plan before continuing. A user may explicitly delegate a choice; record the delegation, its bounds, and the chosen default. Never silently auto-resolve a material user-owned choice.

Apply these checkpoints:

- **Checkpoint A — route selection:** before selecting a route, resolve every material user-owned decision that can change the route.
- **Checkpoint B — new evidence:** after any spike or review creates a new material user-owned choice, resolve and record it before locking or continuing the affected route.
- **Checkpoint C — final review:** before final plan review, prove that the ledger contains no unresolved material user-owned item. Re-run this proof before final approval if review changed the ledger.

Final plan approval confirms the assembled plan; it does not replace earlier confirmation of user-owned decisions. When there are genuinely no unresolved user-owned decisions, record that conclusion and its evidence, then continue without manufacturing a question.

## Plan Content

Include these fields in a durable plan:

- **Frontmatter or header:** plan id, status, created date, base commit or branch, and worktree path when the environment uses them.
- **Goal and invariants:** what must be true when the work is done.
- **Project evidence:** relevant code, tests, docs, runtime paths, current behavior, constraints, and affected boundaries discovered during exploration.
- **Blindspot pass:** historical traps, implicit conventions, boundary conditions, risky assumptions, missing references, and context the user may need to provide.
- **Decision ledger:** every material choice with its stable id, owner, options, recommended default, evidence, status, and recorded answer or delegation; include zero-unresolved evidence at each passed checkpoint.
- **Route analysis and selected design:** brainstormed options with tradeoffs, the selected route, confirmed decisions, and evidence that should not be re-litigated without new data.
- **Spike reports:** each uncertainty that was tested, the method used, observed result, conclusion, and remaining risk.
- **Task breakdown:** executable technical plans derived from the selected route, with owner, status, dependencies, write areas, concrete implementation steps, validation target, done criteria, parallelization notes, and task-system ids when available.
- **Review state:** reviewer or agent findings, resolved questions, accepted residual risks, and remaining non-blocking caveats.
- **Progress, validation, and risks:** current task status, last completed planning step, validation state, blockers, dirty workspace or worktree state, and what remains uncertain.
- **Implementation isolation:** isolated workspace, worktree, branch, or sandbox path and status prepared for implementation handoff.
- **Implementation-session instructions:** after each meaningful implementation task advances, update task status, last completed step, verification performed, blockers, dirty workspace or worktree state, and the next implementation action.
- **Completion or abandonment requirements:** on completion, finalize by the project contract and record final validation; on abandonment, record why and clean up any isolated workspace by the environment's rules.
- **Implementation-session first action:** a complete instruction that lets a cold implementation session start immediately.

Use absolute paths in handoff instructions when another session will read files. For code assets inside an isolated worktree, point at the isolated path, not the main repository path.

If spike reports or task details become too large for the main plan, split them into separate files and keep a concise indexed summary with absolute paths in the plan.

## Handoff Rule

Before handing off to an implementation session after plan completion and review, create or enter the isolated implementation environment using the active environment's mechanism, then update the plan and any task system with current task status, confirmed decisions, accepted risks, validation state, blockers, dirty workspace or worktree state, isolation path or branch, and absolute paths. The implementation-session first action must be executable without chat history. Name the plan path, isolated workspace path, first file or command to inspect, and next concrete edit or validation step. Do not rely on unstated decisions.
