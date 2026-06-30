---
name: prompt-asset-improver
description: "Use before editing durable AI-facing prompt assets: system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. Confirms scope, inventories and backs up assets, chooses self-edit, focused agents, and review by risk, keeps paired assets aligned, and validates resources."
---

# Prompt Asset Improver

Use this skill before editing durable AI-facing text. Keep only rules that change the next task-time action for the agent or the user.

## Scope

Use this skill for system prompts, environment prompts, agent bodies, role instructions, `SKILL.md` files, MCP/tool descriptions, bundled prompt references, and durable prompt templates. Use it for paired assets, such as Codex and Claude variants, when one side could drift from the other.

Do not use it for source comments, project scaffolds, generated documentation snapshots, transient reviewer prompts, or one-off handoff messages unless the user asks to make them durable.

Confirm scope before editing:

- Exact file list: treat the scope as confirmed, repeat it, and edit only those paths.
- Directory, product area, broad asset class, or vague problem: scan likely target roots, show included and excluded paths, ask for confirmation, and stop before editing.
- Affected files outside confirmed scope: ask before expanding scope.
- One side of a paired asset: inspect the counterpart for drift, but edit it only after explicit scope expansion.

Inventory describes assets; it never expands scope by itself.

## Workflow

1. Load project instructions and prompt-asset records.
   - Refresh inventory for each target root after scope confirmation. Use the owning repository, workspace, or user config root as `<target-root>`.
   - Store records under `<target-root>/.prompt-asset-improver/`; put private machine data, local exclusions, backups, and user preferences under `local/`.
   - Put shared project criteria under `shared/` only when the user confirms they belong with the project.
   - In a git repo, ensure `.prompt-asset-improver/local/` is ignored before writing local records.
   - Write `inventory.json` with `root`, `scanned_at`, `expires_at`, `scan_reason`, optional `git_head`, and assets containing `path`, `type`, `scope`, and `reason`.
   - Use `scope: "confirmed"` for editable assets and `scope: "counterpart-check-only"` for paired assets inspected only to prevent drift.
   - Use a 7-day expiry. Refresh inventory when it is missing, expired, points at another root, lists missing files, or the user says the asset set changed.

2. Load custom points and self-improvement candidates.
   - Load shared and local custom points before optimizing.
   - Store standing user preferences in `.prompt-asset-improver/local/custom-points.md` unless the user explicitly marks them project-level.
   - Leave one-time task directions, requested edits for the current asset, rules already covered by this skill, and the current request out of custom points.
   - When the user confirms cleanup of recurring avoidance-only, compatibility, fallback, failover, or recovery-path prose, record that cleanup preference so later runs can apply it without asking again.
   - Keep the user's wording, date, source, and scope. Deduplicate without changing meaning.
   - When review reveals a weakness in this skill, queue it in `.prompt-asset-improver/local/skill-improvements.md` with date, evidence, affected section, and proposed rule change.
   - At workflow start, ask the user to `add to skill`, `discard`, or `keep pending` for each queued candidate before editing other assets.
   - Apply accepted candidates, remove accepted or discarded entries, and delete the queue file when no candidates remain.
   - Do not apply queued candidates without explicit user confirmation.
   - If the user explicitly asks to update `prompt-asset-improver`, treat the request as confirmed scope and do not queue that same request.

3. Back up assets that may change.
   - Back up every editable prompt asset before the first edit.
   - Store backups under `<target-root>/.prompt-asset-improver/local/backups/<timestamp>/`.
   - Include `manifest.json` with `created_at`, `root`, `reason`, and each file's `original_path`, `backup_path`, and hash when available.
   - Back up only assets in confirmed editable scope; check-only counterparts are backed up only after scope expansion.
   - Stop if the backup cannot be written.
   - Prune only manifest-backed backup directories named `YYYYMMDDTHHMMSSZ`; keep the current backup, every backup from the last 7 days, and at least the newest 10.

4. Run a pre-edit audit.
   - Search only changed files and related prompt-asset directories where the same rule can be duplicated.
   - Do not scan session logs, dependencies, generated caches, or whole home directories.
   - Check for duplicate rules, stale language, vague advice, unjustified language drift, low-value frontmatter, hidden dependencies, paired-asset drift, repeated examples, pitfall notes without evidence, local references, bundled resource paths, external links, stale skill names, and stale avoidance-only, compatibility, fallback, failover, or recovery-path prose.
   - Use concrete target names and section titles as search terms; do not run placeholder searches.
   - When the audit finds recurring avoidance-only, compatibility, fallback, failover, or recovery-path prose, ask whether to clean it unless custom points already record that cleanup preference.
   - If one side of a paired asset is confirmed and the audit shows a shared protocol change, stop and ask whether to expand scope.

5. Choose edit mode and review mode using the Decision Points below.

6. Edit with the Editing Standards below.

7. Validate and report before finishing.

## Decision Points

Choose self-edit for very small, low-risk changes when the request is exact, the writable set is narrow, and paired assets can be checked directly. Examples include a single frontmatter or YAML syntax fix, an obviously stale local resource path, pure version or index sync, or an exact user-requested replacement that does not change reusable guidance.

Use focused editing agents for large batches, cross-asset rewrites, high-risk trigger or workflow changes, validation or failure-handling changes, paired assets with adapter-specific differences, or work that benefits from independent synthesis before the lead edits. When in doubt between self-edit and focused-agent scope, choose focused editing agents.

When using focused editing agents:

- Decide edit mode before editing. If focused agents are needed, dispatch them before local content edits; do not start editing and then delegate.
- Dispatch agents after scope confirmation, inventory refresh, custom-point loading, and backup creation.
- Keep lead-owned work with the lead: scope confirmation, inventory, backups, custom points, worktree choice, batch assignment, conflict resolution, final validation, and final report.
- Give each agent a narrow brief: exact target files, allowed write set, active custom points, paired-counterpart rules, value-audit criteria, validation commands, and a ban on widening scope or touching inventory/backups.
- Use one prompt asset file per batch by default. Use one counterpart-group batch for paired files that must stay aligned; split paired files only when the lead provides an explicit final alignment step.
- In asynchronous environments, follow the current environment's delegation and wait protocol. Record returned agent identifiers or handoff handles, tell the user what was dispatched, and stop when the environment requires waiting.
- If the chosen edit mode needs focused agents and they are unavailable or the write set cannot be safely isolated, stop before local content edits, report the blocker, and ask the user whether to narrow scope or wait for agent support. Do not replace the selected focused-agent path with local editing for the same scope.

Choose review level by risk:

- Use self-review for very small, exact, low-risk edits after running the required validation gates.
- Use simple review for material but bounded prompt-asset changes when they do not alter safety, tool, review, delegation, permission, session, backup, validation, or failure-handling gates.
- Use a stronger independent review mechanism for high-risk system prompts, tool contracts, safety boundaries, permission rules, session behavior, security-sensitive instructions, broad rewrites, and changes to this skill's workflow, focused-agent, review, validation, custom-point, backup, or failure-handling gates.
- If the user declines or forbids review, continue only within that constraint and report the skipped review.
- For asynchronous reviewer replies, follow the environment's wait boundary and continue adjudication when replies arrive.

## Editing Standards

Optimize for executable value, not coverage for its own sake.

- Keep high-value rules: safety boundaries, approval gates, validation gates, scope rules, failure handling, and data-location contracts.
- Remove or compress low-value content: repeated summaries, exhaustive report fields, non-actionable implementation detail, historical prose, obvious tool explanations, and examples that do not teach a different decision.
- Leave already-lean scoped assets unchanged or make only targeted improvements; report that decision.
- Keep one source of truth for each rule. Use cross-references only when the reader is guaranteed to load the referenced source.
- Put trigger information in frontmatter descriptions; keep execution detail in the body unless it changes trigger selection.
- Write current facts in imperative language: "do X", "reject Y", "run Z". Replace vague advice with exact actions or exception boundaries.
- Avoid verbose avoidance-only, compatibility, fallback, failover, and recovery-path prose. Keep fallback, failover, and recovery instructions only when they name the next action.
- Rewrite a section or asset directly when the requested change would modify most of a long passage.
- Write maintainer- and agent-facing prompt assets in English by default. Use another language only for user request, audience need, product copy, project convention, deliberate trigger anchors, or quoted/source text.
- Use one language within the same asset type or domain unless the exception is explicit.
- Keep pitfall notes only when they cite evidence such as an incident, issue id, failing command, file path, or user decision.
- Do not make a general asset assume another skill, plugin, product, repository, vendor, or tool exists unless the asset is the integration point or the dependency changes trigger selection.
- Keep `SKILL.md` lean. Move detailed references into `references/`, executable repeat work into `scripts/`, and output assets into `assets/`.

Preserve each asset's job:

- System or environment prompts: preserve priority, safety, tool contracts, session behavior, and project-specific rules; remove workflow detail that belongs in a skill.
- Agents and role instructions: clarify role, input contract, output format, discipline, and failure handling.
- `SKILL.md`: strengthen trigger selection, keep workflow executable, and move supporting detail into bundled resources.
- MCP/tool descriptions: state when to call the tool, required parameters, permission boundaries, and errors that change the caller's next step.

For paired Claude/Codex assets, keep behavior, triggers, validation, and failure handling aligned while preserving actionable adapter-specific mechanics. Edit both sides in the same pass unless the user explicitly confirms one-sided scope.

## Validation

Before finishing, validate every changed prompt asset.

- Re-read the first sentence of every changed section and every `description`; each must say when to use the asset or what action to take.
- Check Markdown links, direct relative paths, and bundled resource paths such as `references/`, `scripts/`, `assets/`, and `agents/`.
- Resolve `SKILL.md` resource paths from the skill directory.
- For prompt templates, classify references as bundled resources or generated-project paths before judging them.
- Fix missing local files, renamed directories, and stale `$skill-name` examples.
- Validate external links only when the user asks or the asset relies on the source; otherwise report them as unchecked.
- Validate frontmatter and changed JSON/YAML.
- Run the skill validator for changed skills. If unavailable, run manual frontmatter, line-count, and resource-path checks and report the missing validator.
- For paired assets, confirm behavior is aligned and adapter differences are intentional.
- Confirm no unrelated project policy moved into a reusable asset and no one-time task direction was recorded as a custom point.
- Run these gates for low-risk self-edits too.

## Final Report

Start with `User Custom Points` listing active points or `none`. Write user-facing report text in plain language.

Then report scope confirmation source, inventory freshness, backup id/path with pruning result and restore method, pending self-improvement candidates, edit mode, review level, focused-agent or reviewer status, dead-link results, parser and validator results, and any skipped gate.

For each changed asset, name the changed sections, explain how the change improves task-time behavior, and note preserved adapter differences. State the decision for scoped assets left unchanged and for pitfall notes kept or removed.
