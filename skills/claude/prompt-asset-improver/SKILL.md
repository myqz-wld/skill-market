---
name: prompt-asset-improver
description: "Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. Confirms scope, backs up files, removes stale/duplicated/low-value rules, keeps paired assets aligned, records durable custom criteria, and validates the result."
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
4. Record the confirmation source in the final report.

## Inventory

After scope confirmation, refresh local inventory for each target root.

- Use the owning repository, workspace, or user config root as `<target-root>`.
- Store scan data in `<target-root>/.prompt-asset-improver/`.
- Put private machine data, local exclusions, backups, and user preferences under `local/`; never commit it.
- Put project-level shared inventory or criteria under `shared/` only when the user confirms it belongs with the project.
- In a git repo, ensure `.prompt-asset-improver/local/` is ignored before writing local data.
- Write `inventory.json` with `root`, `scanned_at`, `expires_at`, `scan_reason`, optional `git_head`, and assets with `path`, `type`, `scope`, and `reason`.

Use a 7-day expiry. Refresh when inventory is missing, expired, points at another root, lists missing files, or the user says the asset set changed.

## Backup

Before the first edit, back up every prompt asset that may change.

- Store backups under `<target-root>/.prompt-asset-improver/local/backups/<timestamp>/`.
- Include `manifest.json` with `created_at`, `root`, `reason`, and each file's `original_path`, `backup_path`, and hash when available.
- Stop if the current backup cannot be written.
- Prune only manifest-backed backup directories named `YYYYMMDDTHHMMSSZ`; keep the current backup, every backup from the last 7 days, and at least the newest 10.
- Report the backup id/path, pruning result, and restore method.

## Custom Points

Use custom points only for durable criteria intended to guide later prompt-asset runs.

- Store standing user preferences in `.prompt-asset-improver/local/custom-points.md` unless the user explicitly marks them project-level.
- Do not record one-time task directions, direct edits requested for the current asset, or rules already covered by this skill.
- Keep the user's wording, date, source, and scope. Deduplicate without changing meaning.
- Load shared and local custom points before every optimization and list active points in the final report.

## Self-Improvement Queue

When review reveals a weakness in this skill, queue it instead of silently changing this skill.

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
- User-facing reports must use plain language. If delegation or review is skipped because an agent would return asynchronously or require another turn, say that directly and explain why local editing or self-review was chosen; do not use protocol shorthand such as "cannot return inside the current workflow" without explanation.

## Editing Rules

1. Keep one source of truth for each rule. Use cross-references only when the reader is guaranteed to load the referenced source.
2. Write current facts only. Remove deprecated, transitional, future-looking, compatibility, old-structure, or migration prose.
3. Use executable language: "do X", "reject Y", "run Z". Replace vague advice with exact actions or exception boundaries.
4. Keep fallback handling only when it changes the next action.
5. Write new or revised prompt text in English by default. Use another language only for user request, audience need, product copy, project convention, or quoted/source text.
6. Use one language within the same asset type or domain unless the exception is explicit.
7. Keep pitfall notes only when they include evidence such as an incident, issue id, failing command, file path, or user decision.
8. Put trigger information in frontmatter descriptions, not only in the body.
9. Do not make a general asset assume another skill, plugin, product, repository, vendor, or tool exists unless this asset is the integration point or the dependency changes trigger selection.
10. Keep `SKILL.md` lean. Move detailed references into `references/`, executable repeat work into `scripts/`, and output assets into `assets/`.
11. For paired Claude/Codex assets, edit both sides in the same pass or report that no counterpart exists. Keep behavior, triggers, validation, and failure handling aligned; preserve only actionable adapter-specific mechanics.

## Asset Focus

- System or environment prompts: preserve priority, safety, tool contracts, session behavior, and project-specific rules; remove workflow detail that belongs in a skill.
- Agents and role instructions: clarify role, input contract, output format, discipline, and failure handling.
- `SKILL.md`: strengthen trigger selection, keep workflow executable, and move supporting detail into bundled resources.
- MCP/tool descriptions: state when to call the tool, required parameters, permission boundaries, and errors that change the caller's next step.

## Pre-Edit Audit

Search only changed files and related prompt-asset directories where the same rule can be duplicated. Do not scan session logs, dependencies, generated caches, or whole home directories.

Check for duplicate rules, stale language, vague advice, unjustified language drift, low-value frontmatter, hidden dependencies, paired-asset drift, repeated examples, pitfall notes without evidence, local references, bundled resource paths, external links, and stale skill names. Use concrete target names and section titles as search terms; do not run placeholder searches.

## Dead Link Check

Before finishing, check changed assets for dead local references.

- Check Markdown links, direct relative paths, and bundled resource paths such as `references/`, `scripts/`, `assets/`, and `agents/`.
- Resolve `SKILL.md` resource paths from the skill directory.
- For prompt templates, classify references as bundled resources or generated-project paths before judging them.
- Fix missing local files, renamed directories, and stale `$skill-name` examples.
- Validate external links only when the user asks or the asset relies on the source; otherwise report them as unchecked.

## Editing Batches

After the audit, split confirmed scope into batches.

- Default to one prompt asset file per batch.
- Use one counterpart-group batch for paired files that must stay aligned.
- Use editing agents only when they can return results in the current workflow and the write sets are disjoint.
- Keep scope confirmation, backups, inventory writes, conflict resolution, final validation, and the final report with the lead agent.
- If delegation is skipped, say why in user-facing language and describe what local validation replaced it.

## Validation

Before finishing:

- Re-read the first sentence of every changed section and every `description`; each must say when to use the asset or what action to take.
- Validate frontmatter and changed JSON/YAML when present.
- Run the skill validator for changed skills. If unavailable, run manual frontmatter, line-count, and resource-path checks and report the missing validator.
- Use a review agent when it can return in the current workflow. Otherwise self-review and report what independent coverage is missing.
- Confirm no unrelated project policy moved into a reusable asset and no custom point records one-time task direction.

## Final Report

Start with `User Custom Points`.

Include scope confirmation method, inventory freshness, confirmed assets, backup id/path, pruning result, batch assignments, delegation decision, changed files, pitfall-note decisions, dead-link results, validation results, pending self-improvement candidates, and restore note. For each changed asset, name the changed sections, summarize the content shift, explain why it improves task-time behavior, and note preserved adapter differences.
