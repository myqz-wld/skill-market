---
name: prompt-asset-improver
description: "Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. Confirms scope, backs up files, delegates substantive edits to focused editing agents, allows only narrow mechanical exceptions, keeps paired assets aligned, and validates changes."
---

# Prompt Asset Improver

Use this skill before editing durable AI-facing text. Every retained rule must change the next action for the agent or the user at task time.

## Scope

Apply this skill to system prompts, agent bodies, `SKILL.md` files, MCP/tool descriptions, and long-lived prompt references. Do not apply it to source comments, project scaffolds, generated documentation snapshots, transient reviewer prompts, or one-off handoff messages unless the user asks to make them durable.

## Scope Confirmation

Confirm edit scope before changing prompt assets. Inventory describes assets; it never expands scope by itself.

1. If the user names exact assets, treat them as confirmed and repeat the scope before editing.
2. If the user names a directory, product area, broad asset class, or vague problem, scan likely target roots, show included and excluded paths, ask for confirmation, and stop before editing.
3. If the audit finds duplicated rules, paired counterparts, or affected assets outside confirmed scope, ask whether to expand scope before editing them.
4. If the user deliberately limits work to one side of a paired asset, inspect the counterpart for drift but do not edit it without explicit scope expansion.

## Inventory

After scope confirmation, refresh local inventory for each target root.

- Use the owning repository, workspace, or user config root as `<target-root>`.
- Store scan data in `<target-root>/.prompt-asset-improver/`.
- Put private machine data, local exclusions, backups, and user preferences under `local/`; never commit it.
- Put project-level shared inventory or criteria under `shared/` only when the user confirms it belongs with the project.
- In a git repo, ensure `.prompt-asset-improver/local/` is ignored before writing local data.
- Write `inventory.json` with `root`, `scanned_at`, `expires_at`, `scan_reason`, optional `git_head`, and assets with `path`, `type`, `scope`, and `reason`.
- Use `scope: "confirmed"` for editable assets and `scope: "counterpart-check-only"` for paired assets inspected only to prevent drift.

Use a 7-day expiry. Refresh when inventory is missing, expired, points at another root, lists missing files, or the user says the asset set changed.

## Backup

Before the first edit, back up every prompt asset that may change.

- Store backups under `<target-root>/.prompt-asset-improver/local/backups/<timestamp>/`.
- Include `manifest.json` with `created_at`, `root`, `reason`, and each file's `original_path`, `backup_path`, and hash when available.
- Back up only assets that may be edited in the confirmed scope; check-only counterparts are backed up only after the user expands scope.
- Stop if the current backup cannot be written.
- Prune only manifest-backed backup directories named `YYYYMMDDTHHMMSSZ`; keep the current backup, every backup from the last 7 days, and at least the newest 10.

## Custom Points

Use custom points only for durable criteria intended to guide later prompt-asset runs.

- Store standing user preferences in `.prompt-asset-improver/local/custom-points.md` unless the user explicitly marks them project-level.
- Do not record one-time task directions, direct edits requested for the current asset, or rules already covered by this skill.
- Keep the user's wording, date, source, and scope. Deduplicate without changing meaning.
- Load shared and local custom points before every optimization.

## Self-Improvement Queue

When review reveals a weakness in this skill, queue it instead of silently changing this skill. If the user explicitly asks to update `prompt-asset-improver`, treat that request as confirmed scope and handle it through this skill's normal editing workflow, including focused editing agents when required; do not queue the same request.

1. Record candidates in `.prompt-asset-improver/local/skill-improvements.md` with date, evidence, affected section, and proposed rule change.
2. At workflow start, ask the user to `add to skill`, `discard`, or `keep pending` for each pending candidate before editing other assets.
3. Apply accepted candidates, remove accepted or discarded entries, and delete the queue file when no pending candidates remain.
4. Do not apply self-improvement candidates without explicit user confirmation.

## Prompt Value Audit

Optimize for executable value, not coverage for its own sake.

- Keep high-value rules even if they are long: safety boundaries, approval gates, validation gates, scope rules, failure handling, and data-location contracts.
- Remove or compress low-value content: repeated section summaries, exhaustive report field lists, implementation detail that does not change the next action, historical/migration prose, obvious tool explanations, and examples that do not teach a different decision.
- Prefer one strong rule over the same rule repeated in frontmatter, overview, workflow, final check, and report format.
- Do not edit every scoped asset just to show activity. If a file is already lean, leave it unchanged or make only a targeted improvement and report that decision.
- Frontmatter should select the skill. Move execution details into the body unless they change trigger selection.
- User-facing reports must use plain language.

## Editing Rules

1. Keep one source of truth for each rule. Use cross-references only when the reader is guaranteed to load the referenced source.
2. Write current facts only. Remove deprecated, transitional, future-looking, compatibility, old-structure, or migration prose.
3. Use executable language: "do X", "reject Y", "run Z". Replace vague advice with exact actions or exception boundaries.
4. Keep fallback handling only when it changes the next action.
5. Write maintainer- and agent-facing prompt assets in English by default. Use another language only for user request, audience need, product copy, project convention, deliberate trigger anchors, or quoted/source text.
6. Use one language within the same asset type or domain unless the exception is explicit.
7. Keep pitfall notes only when they include evidence such as an incident, issue id, failing command, file path, or user decision.
8. Put trigger information in frontmatter descriptions, not only in the body.
9. Do not make a general asset assume another skill, plugin, product, repository, vendor, or tool exists unless this asset is the integration point or the dependency changes trigger selection.
10. Keep `SKILL.md` lean. Move detailed references into `references/`, executable repeat work into `scripts/`, and output assets into `assets/`.
11. For paired Claude/Codex assets, keep behavior, triggers, validation, and failure handling aligned while preserving actionable adapter-specific mechanics. Edit both sides in the same pass unless the user explicitly confirmed a one-sided scope (handled per Scope Confirmation and Pre-Edit Audit).

## Asset Focus

- System or environment prompts: preserve priority, safety, tool contracts, session behavior, and project-specific rules; remove workflow detail that belongs in a skill.
- Agents and role instructions: clarify role, input contract, output format, discipline, and failure handling.
- `SKILL.md`: strengthen trigger selection, keep workflow executable, and move supporting detail into bundled resources.
- MCP/tool descriptions: state when to call the tool, required parameters, permission boundaries, and errors that change the caller's next step.

## Pre-Edit Audit

Search only changed files and related prompt-asset directories where the same rule can be duplicated. Do not scan session logs, dependencies, generated caches, or whole home directories.

Check for duplicate rules, stale language, vague advice, unjustified language drift, low-value frontmatter, hidden dependencies, paired-asset drift, repeated examples, pitfall notes without evidence, local references, bundled resource paths, external links, and stale skill names. Use concrete target names and section titles as search terms; do not run placeholder searches.

When the confirmed scope is one side of a paired asset, audit the counterpart before editing. If the proposed edit would change shared protocol semantics, stop and ask whether to expand scope.

## Focused Editing Agents

Use focused editing agents after scope confirmation, inventory refresh, custom-point loading, and backup creation for every edit that can change rule meaning, workflow behavior, triggers, validation, failure handling, or reusable guidance.

- Dispatch focused editing agents for substantive prompt-asset batches before local content edits. Do not edit first and delegate afterward. Do not require the agent to return in the same turn.
- Skip focused editing agents only for low-risk mechanical edits: a single-file frontmatter/YAML syntax fix, an obviously stale local resource path, pure version/index sync, or exact user-requested text replacement that does not change rule semantics.
- Treat any uncertain case as substantive and dispatch focused editing agents.
- Mechanical exceptions still require confirmed scope, backup, dead-link check, frontmatter/YAML validation when present, and final report.
- Keep lead-owned steps with the lead: scope confirmation, inventory, backups, custom points, worktree choice, batch assignment, conflict resolution, final validation, and final report.
- Give each editing agent a narrow brief: exact target files, allowed write set, active custom points, paired-counterpart rules, value-audit criteria, validation commands, and a ban on widening scope or touching inventory/backups.
- Use one prompt asset file per batch by default. Use one counterpart-group batch for paired files that must stay aligned; never split a pair across agents unless the lead provides an explicit final alignment step.
- In asynchronous agent environments, use the current environment's normal delegation and wait protocol. Record the returned agent identifiers or handoff handles, tell the user what was dispatched, then stop when the environment requires waiting. When replies arrive, inspect diffs, merge accepted edits, resolve conflicts, and update progress.
- If a substantive edit needs focused editing agents but they cannot be dispatched because tools are unavailable or the write set cannot be safely isolated, stop before local content edits and report the blocker in plain language. Do not self-edit as a fallback.

## Dead Link Check

Before finishing, check changed assets for dead local references.

- Check Markdown links, direct relative paths, and bundled resource paths such as `references/`, `scripts/`, `assets/`, and `agents/`.
- Resolve `SKILL.md` resource paths from the skill directory.
- For prompt templates, classify references as bundled resources or generated-project paths before judging them.
- Fix missing local files, renamed directories, and stale `$skill-name` examples.
- Validate external links only when the user asks or the asset relies on the source; otherwise report them as unchecked.

## Validation

Before finishing, validate every changed prompt asset.

- Re-read the first sentence of every changed section and every `description`; each must say when to use the asset or what action to take.
- Validate frontmatter and changed JSON/YAML when present.
- Run the skill validator for changed skills. If unavailable, run manual frontmatter, line-count, and resource-path checks and report the missing validator.
- For mechanical exception edits, run the same changed-asset gates: dead-link/resource-path check, frontmatter/YAML validation when present, and final report. Do not skip these checks because no focused editing agent was dispatched.
- Use the current environment's independent review mechanism for material changes to system prompts, agents, `SKILL.md`, MCP/tool descriptions, paired assets, or this skill itself. Do not require a specific review skill, plugin, tool API, message protocol, or product. Asynchronous reviewer replies are acceptable: dispatch the review, follow the environment's wait boundary, and continue adjudication when replies arrive. Self-review only when review tools are unavailable, the user explicitly declines review, or the change is mechanical and the user did not ask for agents.
- Missing focused-agent tools are a blocker for substantive edits under `Focused Editing Agents`; independent review or self-review never substitutes for required focused editing agents.
- Confirm no unrelated project policy moved into a reusable asset and no custom point records one-time task direction.

## Final Report

Start with `User Custom Points` listing the active points.

Then report: scope confirmation source, inventory freshness, backup id/path with pruning result and restore method, batch assignments with delegation status, independent review status, dead-link results, validation results, and pending self-improvement candidates.

For each changed asset, name the changed sections, explain why the change improves task-time behavior, and note preserved adapter differences. State the decision for scoped assets left unchanged and for pitfall notes kept or removed.
