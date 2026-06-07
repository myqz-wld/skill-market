---
name: complex-plan-workflow
description: Use before coding when work is risky, design-heavy, multi-session, blocked by an uncertain decision, needs a spike/RFC, or needs a durable plan for handoff. Provides a generic plan/RFC/spike/review workflow and defers project-specific worktree, handoff, archive, and tool contracts to the active environment.
---

# Complex Plan Workflow

Use this skill before implementing work that needs durable planning, evidence gathering, or cross-session handoff. Preserve decisions, evidence, progress, and the next action outside chat so a later agent can continue without rediscovering the design.

## Boundary

This skill is generic. It does not define product-specific tools, repository paths, archive automation, or team/session semantics. When an environment prompt, project prompt, or tool description defines plan locations, worktree commands, handoff prompts, archive steps, or review commands, follow that contract first and use this skill only for the reusable planning method.

Do not make an application baseline depend on this skill. Product prompt assets must still contain the minimum protocol needed for their own tools and handoff flows.

## Trigger

Create or update a plan before coding when any condition applies:

- The change is expected to span multiple sessions or several independent phases.
- The design is uncertain, user intent needs narrowing, or a breaking interface is involved.
- A library, SDK, API, performance claim, or sandbox behavior must be measured before design is final.
- The work crosses module, process, schema, adapter, or permission boundaries.
- A failed implementation needs a clear isolation or abandonment path.

For small, local, reversible edits, skip the plan and work directly.

## Workflow

1. **Frame the outcome.** Write the goal, non-goals, known constraints, and success checks in durable text before editing code.
2. **Run RFC when design is unclear.** Ask the user focused questions about the decision that blocks implementation. Keep each round narrow. Record final decisions and the reason for each one in the plan.
3. **Run spikes for unverified assumptions.** Build the smallest script, command, or throwaway test that measures the unknown behavior. Save the command, observed output, conclusion, and remaining risk. Replace "pending spike" notes with the evidence-backed result.
4. **Write the plan document.** Use the path and frontmatter required by the current project. Include at least: goal, invariants, design decisions, implementation checklist, current progress, validation steps, known risks, and next-session first action.
5. **Review the plan before large edits.** Use the review process available in the environment. Resolve blocking findings before implementation; record accepted residual risk.
6. **Isolate implementation when needed.** Use the worktree, branch, or sandbox mechanism specified by the environment. Keep code changes out of the main working tree when the plan is meant to be isolated.
7. **Update progress continuously.** After each meaningful phase, mark completed checklist items, write what changed, list what was verified, and update the next-session first action.
8. **Handoff deliberately.** Before pausing or spawning a new session, make the worktree clean if the environment requires it, then ensure the next session can start from the plan alone.
9. **Close or abandon explicitly.** On completion, archive or merge by the project contract and record final validation. On abandonment, record why and clean up the isolated workspace by the environment's rules.

## Plan Content

Include these fields in a durable plan:

- **Frontmatter or header:** plan id, status, created date, base commit/branch, and worktree path when the environment uses them.
- **Goal and invariants:** what must be true when the work is done.
- **Design decisions:** decisions that require new evidence before re-litigation.
- **Checklist:** concrete implementation steps with status.
- **Current progress:** where the work stopped and what remains unknown.
- **Validation:** commands or checks that prove the change works.
- **Known risks:** evidence-backed risks, edge cases, or rejected alternatives.
- **Next-session first action:** a complete instruction that lets a cold session start immediately.

Use absolute paths in handoff instructions when another session will read files. For code assets inside an isolated worktree, point at the isolated path, not the main repository path.

## Handoff Rule

The next-session first action must be executable without chat history. Name the plan path, the workspace path if any, the first file or command to inspect, and the next concrete edit or validation step. Do not rely on "continue from above" or unstated decisions.
