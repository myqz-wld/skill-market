---
name: complex-plan-workflow
description: Use before coding when work may span sessions, crosses module/process/schema/adapter/permission boundaries, changes protocols or lifecycles, needs rollback/isolation, depends on unverified library/API/SDK/performance/sandbox behavior, or has unclear design/user intent. Create or update a durable plan while deferring concrete paths, tools, review, archive, and handoff contracts to the active environment.
---

# Complex Plan Workflow

Use this skill before implementing work that needs durable planning, evidence gathering, risk isolation, or cross-session handoff. Create or update a plan that preserves decisions, evidence, progress, validation, and the next action outside chat.

## Boundary

This skill is generic. It does not define product-specific tools, repository paths, archive automation, or team/session semantics. When an environment prompt, project prompt, or tool description defines plan locations, worktree commands, handoff prompts, archive steps, or review commands, follow that contract first and use this skill only for the reusable planning method.

Do not make an application baseline depend on this skill. Product prompt assets must still contain the minimum protocol needed for their own tools and handoff flows.

## Trigger

Create or update a plan before implementation when any condition applies:

- The work is likely to span multiple sessions, require handoff, or proceed through several phases that must survive outside chat.
- The design is unclear, user intent needs narrowing, an RFC-style decision is needed, or a breaking interface/API/contract is involved.
- A library, SDK, API, performance claim, concurrency behavior, sandbox behavior, or tool limitation must be measured before design is final.
- The change crosses module, process, schema, data-migration, adapter, permission, auth, storage, protocol, lifecycle, or deployment boundaries.
- A broad refactor, migration, incident recovery, rollback-sensitive change, or failed implementation needs an isolation, abandonment, or recovery path.
- The work affects shared architecture, long-lived workflow, state machine, external integration, or durable prompt/tool behavior.

Skip the plan for trivial questions, small local reversible edits, or single-file changes with an obvious implementation and validation path.

## Workflow

1. **Frame the outcome.** Write the goal, non-goals, known constraints, and success checks in durable text before editing code.
2. **Run RFC when design is unclear.** Ask the user focused questions about the decision that blocks implementation. Keep each round narrow. Record final decisions and the reason for each one in the plan.
3. **Run spikes for unverified assumptions.** Build the smallest script, command, or throwaway test that measures the unknown behavior. Save the command, observed output, conclusion, and remaining risk. Replace "pending spike" notes with the evidence-backed result.
4. **Write or update the plan document.** Use the path and frontmatter required by the current project. Include at least: goal, invariants, design decisions, implementation checklist, current progress, validation steps, known risks, and next-session first action.
5. **Review the plan before large edits.** Use the review process available in the environment. Resolve blocking findings before implementation; record accepted residual risk.
6. **Isolate implementation when needed.** Use the worktree, branch, or sandbox mechanism specified by the environment. Keep code changes out of the main working tree when the plan is meant to be isolated.
7. **Update progress continuously.** After each meaningful phase, mark completed checklist items, write what changed, list what was verified, and update the next-session first action.
8. **Handoff deliberately.** Before pausing or transferring work, make the worktree clean if the environment requires it, then ensure the next session can start from the plan alone.
9. **Close or abandon explicitly.** On completion, archive or merge by the project contract and record final validation. On abandonment, record why and clean up the isolated workspace by the environment's rules.

## Plan Content

Include these fields in a durable plan:

- **Frontmatter or header:** plan id, status, created date, base commit/branch, and worktree path when the environment uses them.
- **Goal and invariants:** what must be true when the work is done.
- **Design decisions:** decisions that require new evidence before re-litigation.
- **Checklist:** concrete implementation steps with status.
- **Progress, validation, and risks:** where work stopped, what proves it works, and what remains uncertain.
- **Next-session first action:** a complete instruction that lets a cold session start immediately.

Use absolute paths in handoff instructions when another session will read files. For code assets inside an isolated worktree, point at the isolated path, not the main repository path.

## Handoff Rule

The next-session first action must be executable without chat history. Name the plan path, the workspace path if any, the first file or command to inspect, and the next concrete edit or validation step. Do not rely on "continue from above" or unstated decisions.
