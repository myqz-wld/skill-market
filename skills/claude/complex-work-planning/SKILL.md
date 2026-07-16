---
name: complex-work-planning
description: "Use when the user explicitly requests this skill. When a complex implementation, architecture change, or other large-scale code change is detected before coding, ask whether to start it. Once approved, create a durable plan with staged confirmation of user-owned decisions, split work into tasks, and prepare an isolated implementation handoff only after the plan is complete."
---

# Complex Work Planning

Once started by explicit user request or approval, use this skill for complex implementation work, architecture changes, or other large-scale code changes that need durable planning, evidence gathering, risk isolation, or coordination across planning sessions. Before selecting a route, surface assumptions and tradeoffs, classify material decisions, and resolve user-owned choices through staged interviews. Maintain a durable plan with the decision ledger, project evidence, task and validation state, coordination state, and the next action outside chat.

## Boundary

This skill defines the planning method only. Follow the active environment or project contract for plan paths, task tools, worktrees, review, archive, and handoff mechanics.

## Deterministic Work Boundary

Separate semantic inference from deterministic state transitions in both the proposed design and the planning workflow. Use an LLM only when the result requires language understanding, synthesis, or judgment. Implement operations that can be specified exactly and verified mechanically—such as copying, concatenation, ordering, exact-rule filtering, indexing, hashing, schema validation, aggregation, persistence, and state transitions—with code or a deterministic tool.

Give each LLM call only the minimum context needed to produce a new semantic delta. Preserve accepted state outside the model, and use deterministic code to append, merge, validate, or otherwise carry that delta forward. Never ask an LLM to reproduce unchanged content, preserve text byte for byte, or perform an exact transformation that ordinary code can complete. When deterministic tooling does not exist, plan its implementation instead of substituting model work.

For every proposed LLM call, identify the semantic responsibility, minimum inputs, smallest useful output or delta schema, deterministic assembly step, and mechanical validation. Remove the model call when no semantic responsibility remains.

## Workflow

1. **Clarify the request.** Define the goal, non-goals, scope boundaries, constraints, success checks, and candidate decisions without silently filling material product gaps.
2. **Explore the project.** Inspect relevant code, tests, docs, configuration, and runtime paths. Record current behavior, evidence, constraints, and affected boundaries.
3. **Run a blindspot pass.** Surface historical traps, implicit conventions, boundary conditions, risky assumptions, missing references, and context the user may need to provide.
4. **Build the decision ledger.** Record and classify every material choice through the Decision Interview Protocol.
5. **Brainstorm and select a route.** Compare viable approaches by benefits, costs, risks, validation needs, impact, and compliance with the Deterministic Work Boundary. Pass Checkpoint A before helping the user choose and detail a route.
6. **Run targeted spikes.** Test unverified assumptions with the smallest sufficient investigation. Record the question, method, command or file inspected, observed result, conclusion, and remaining risk. Apply Checkpoint B to any new user-owned choice.
7. **Keep the plan current and split the work.** Record the cross-task validation strategy in the Plan Content and synchronize any task system before deriving independently executable tasks with ownership, dependencies, write areas, implementation steps, validation targets, and done criteria.
8. **Review the final plan.** Pass Checkpoint C, then challenge assumptions, evidence, dependencies, parallelization safety, validation, rollback, and handoff readiness. If review creates a user-owned choice, return to Checkpoint B and pass Checkpoint C again before requesting separate final-plan approval.
9. **Prepare isolation and hand off.** Complete the Handoff Rule only after the assembled plan is approved through the user-facing or environment-required confirmation process.

## Decision Interview Protocol

For each decision, record in the durable ledger a stable id; question and impact; owner (user, project constraint, or engineering); options with the recommended default first; evidence or source; status (unresolved, confirmed, constrained, or delegated); and the confirmed answer or delegation.

Treat a material choice as user-owned unless the user or an explicit project contract already fixes it when it affects:

- scope or exclusions;
- user-visible behavior or workflow;
- a public API or configuration surface;
- provider, model, or settings behavior;
- permissions, security, data disclosure, or code-execution capability;
- persistence, retention, deletion, migration, downgrade, backup, or rollback policy;
- operational cost or external side effects.

Use project constraint only when a cited contract or project artifact fixes the choice. Use engineering only for implementation choices that do not change a user-owned boundary. Never infer product policy from technical convenience.

Ask 1-3 related, next-step-blocking decisions per interaction, with the recommended option first and its tradeoff. If more than three choices must be understood together, present one structured decision set instead of splitting it mechanically. Use a dedicated user-input mechanism when available; otherwise ask in chat and stop for the answer. Record each answer in the durable ledger before continuing. For a delegated choice, record its bounds and selected default. Never silently resolve a material user-owned choice.

Apply these checkpoints:

- **Checkpoint A — route selection:** resolve every material user-owned decision that can change the route.
- **Checkpoint B — new evidence:** resolve and record any user-owned choice created by a spike or review before continuing the affected route.
- **Checkpoint C — final review:** prove that no material user-owned item remains unresolved; repeat after review if the ledger changed.

Final plan approval confirms the assembled plan; it never replaces earlier decision confirmation. If no user-owned decision is unresolved, record that conclusion and its evidence without manufacturing a question.

## Plan Content

Keep the durable plan sufficient for a cold implementation session:

- **Identity and goal:** plan id, status, created date, base commit or branch, worktree path when used, goal, and invariants.
- **Evidence and design:** project evidence, current behavior and boundaries, blindspot findings, route options and tradeoffs, selected design, and evidence that should not be re-litigated without new data.
- **Model boundary:** each proposed LLM call's semantic responsibility, minimum inputs, delta output schema, deterministic assembly, and mechanical validation; deterministic tooling tasks required to remove model-owned exact work.
- **Decisions and uncertainty:** the ledger defined by the Decision Interview Protocol, including recorded answers and delegations, checkpoint evidence, and spike reports with remaining risk.
- **Tasks and review:** executable tasks with owner, status, dependencies, write areas, steps, validation, done criteria, parallelization notes, and task-system ids; reviewer findings, resolutions, accepted residual risks, and caveats.
- **Execution state:** task status and progress, last completed step, verification performed, validation state, blockers, dirty workspace or worktree state, remaining uncertainty, isolation path and status, and the next implementation action. Require implementation sessions to update this after each meaningful task.
- **Completion and abandonment:** project-required finalization with recorded final validation, or the abandonment reason and isolation cleanup.
- **Cold-start instruction:** the first action an implementation session can execute without chat history.

If spike reports or task details outgrow the main plan, split them into separate files and keep an indexed summary with absolute paths.

## Handoff Rule

After that final approval, enter the isolated implementation environment and bring the plan and any task system up to date with the Plan Content. Use absolute paths and point code references at the isolated workspace. The cold-start instruction must name the plan path, isolation path, first file or command to inspect, and next edit or validation step. Do not rely on unstated decisions.
