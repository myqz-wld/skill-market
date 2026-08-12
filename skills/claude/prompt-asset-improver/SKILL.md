---
name: prompt-asset-improver
description: "Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, skill interface metadata, catalog descriptions, MCP/tool descriptions, bundled prompt references, and prompt templates, especially when paired Codex/Claude assets may drift. Confirms scope, lists proposed changes for user approval, backs up and edits only confirmed editable files, and validates resources."
---

# Prompt Asset Improver

Use this skill before editing durable AI-facing prompt assets. Keep only rules that change the next task-time action for the agent or the user.

## Scope

Use this skill for system prompts, environment prompts, agent bodies, role instructions, `SKILL.md` files, skill interface metadata, catalog descriptions, MCP/tool descriptions, bundled prompt references, and durable prompt templates. Use it for paired assets, such as Codex and Claude variants, when one side could drift from the other.

Do not use it for source comments, project scaffolds, generated documentation snapshots, transient reviewer prompts, or one-off handoff messages unless the user asks to make them durable.

Confirm scope before editing:

- Exact file list: treat the scope as confirmed, repeat it, and edit only those paths.
- Directory, product area, broad asset class, or vague problem: scan likely target roots, show included and excluded paths, ask for confirmation, and stop before editing.
- Affected files outside confirmed scope: ask before expanding scope.
- One side of a paired asset: inspect the counterpart for drift, but edit it only after explicit scope expansion.

Inventory describes assets; it never expands scope by itself.

## Workflow

1. Load project instructions and prompt-asset records.
   - Refresh inventory for each confirmed target root. Use the owning repository, workspace, or user config root as `<target-root>`.
   - Store records under `<target-root>/.prompt-asset-improver/`; put private machine data, local exclusions, backups, user preferences, and the asset inventory under `local/`.
   - Put shared project criteria under `shared/` only when the user confirms they belong with the project.
   - In a git repo, ensure `.prompt-asset-improver/local/` is ignored before writing local records.
   - Write the inventory only to `<target-root>/.prompt-asset-improver/local/inventory.json`, never to `.prompt-asset-improver/` directly or `shared/`. Include `root`, `scanned_at`, `expires_at`, `scan_reason`, optional `git_head`, and assets containing `path`, `type`, `scope`, `reason`, optional `exists`, and optional current `hash`.
   - After editing and validation, refresh hashes for changed assets in `.prompt-asset-improver/local/inventory.json`.
   - Use `scope: "confirmed"` for editable assets and `scope: "counterpart-check-only"` for paired assets inspected only to prevent drift.
   - Use a 7-day expiry. Refresh inventory when it is missing, expired, points at another root, lists missing files, or the user says the asset set changed.

2. Load custom points.
   - Load `.prompt-asset-improver/shared/custom-points.md` and `.prompt-asset-improver/local/custom-points.md` before proposing changes when they exist.
   - Store standing user preferences in `.prompt-asset-improver/local/custom-points.md`; store project-level preferences in `.prompt-asset-improver/shared/custom-points.md` only when the user explicitly marks them project-level.
   - Leave one-time task directions, requested edits for the current asset, rules already covered by this skill, and the current request out of custom points.
   - When the user confirms a reusable cleanup preference, record the user's wording, date, source, and scope. Deduplicate without changing meaning.

3. Run a pre-edit audit.
   - Search only confirmed editable files and related prompt-asset surfaces where the same rule can be duplicated, such as paired counterparts, interface metadata, catalog rows, bundled references, and prompt templates.
   - Do not scan session logs, dependencies, generated caches, or whole home directories.
   - Check for duplicate rules, stale language, vague advice, unjustified language drift, low-value frontmatter, hidden dependencies, paired-asset drift, incomplete tool contracts, under-specified errors, repeated examples, pitfall notes without evidence, local references, bundled resource paths, external links, stale skill names, and low-value negative or failure prose.
   - Use concrete target names and section titles as search terms; do not run placeholder searches.
   - If one side of a paired asset is confirmed and the audit shows a shared protocol change, ask whether to expand scope before proposing edits.

4. Present the proposed change list and wait for user confirmation.
   - List each path and section that would change.
   - State the intended edit for each change, including whether it adds, removes, compresses, or rewrites behavior.
   - For high-risk or easily misunderstood edits, include representative wording or a short before/after sketch.
   - State scoped sections or files that will remain unchanged when the user could reasonably expect them to change.
   - State preserved mechanisms, data structures, and paired-asset differences.
   - Stop before backup or editing until the user confirms the list or gives revisions.
   - If the actual edit would differ materially from the confirmed list, stop and present the revised change before editing it.

5. Back up confirmed editable assets that may change.
   - Back up every confirmed editable prompt asset that may change before editing.
   - Store backups under `<target-root>/.prompt-asset-improver/local/backups/<timestamp>/`.
   - Include `manifest.json` with `created_at`, `root`, `reason`, and each file's `original_path`, `backup_path`, and original pre-edit `hash` when available.
   - Back up only assets in confirmed editable scope; check-only counterparts are backed up only after scope expansion.
   - Stop if the backup cannot be written.
   - Prune only manifest-backed backup directories named `YYYYMMDDTHHMMSSZ`; keep the current backup, every backup from the last 7 days, and at least the newest 10.

6. Edit with the Editing Standards below.

7. Validate and report before finishing.

## Edit Decisions

Choose the smallest edit that satisfies the confirmed change list. Rewrite a section or asset directly when a local patch would leave duplicate rules, contradictions, or require changing most sentences in the section.

Treat trigger selection, tool contracts, safety boundaries, permission rules, session behavior, backup rules, validation gates, failure handling, and this skill's workflow as high-risk content. For high-risk content, keep the change list explicit and the final validation strict. If the edit reveals another behavior change, return to the proposed change list before editing it.

Leave already-lean confirmed editable assets unchanged unless the confirmed change list names a concrete behavior improvement.

## Editing Standards

Optimize for executable value, not coverage for its own sake.

- Keep high-value rules: safety boundaries, tool contracts, permission rules, session behavior, approval gates, validation gates, scope rules, failure handling, and data-location contracts.
- Remove or compress repeated summaries, exhaustive report fields, historical prose, obvious tool explanations, and examples that do not teach a different decision.
- Keep one source of truth for each rule. Use cross-references only when the reader is guaranteed to load the referenced source.
- Put trigger information in frontmatter descriptions, interface metadata, and catalog descriptions; keep execution detail in the body unless it changes trigger selection.
- Write current facts in imperative language: "do X", "reject Y", "run Z". Replace vague advice with exact actions or exception boundaries.
- Keep fallback, failover, and recovery instructions only when they name the next action.
- Write maintainer- and agent-facing prompt assets in English by default. Use another language only for user request, audience need, product copy, project convention, deliberate trigger anchors, or quoted/source text.
- Use one language within the same asset type or domain unless the exception is explicit.
- Keep pitfall notes only when they cite evidence such as an incident, issue id, failing command, file path, or user decision.
- Do not make a general asset assume another skill, plugin, product, repository, vendor, or tool exists unless the asset is the integration point or the dependency changes trigger selection, required action, or validation.
- Keep `SKILL.md` lean. Move detailed references into `references/`, executable repeat work into `scripts/`, and output assets into `assets/`.

### Tool and Error Contracts

When an asset enables or instructs an agent to call a tool, put the complete effective contract in the agent-visible prompt before the first tool decision. Include the exact tool name and call conditions; complete input and output schemas; every field's type, required or optional status, accepted format, enum or range, default, and nullability; cross-field dependencies and mutual exclusions; permissions, preconditions, side effects, idempotency, retry and timeout behavior; and the success criteria and errors that change the caller's next action. If the complete contract is unavailable, stop and obtain it; do not authorize the call or let the agent infer missing behavior from examples, prior knowledge, implementation details, or unloaded documentation.

Make every specified error self-sufficient for recovery. Include the failed operation and phase, affected field or resource, received value when safe, complete violated constraint, expected schema or allowed values, relevant state and identifiers, whether retry is valid, and the exact next action. Replace generic errors such as `invalid input`, hidden-log dependencies, or partial hints that still require the agent to guess.

Remove or rewrite low-value negative and failure prose when it matches these patterns:

- "Avoid X", "do not X", or "never X" without the required alternative action, exception boundary, or stop condition.
- "Be careful", "handle errors", "recover gracefully", or "make it robust" without a command, check, retry limit, escalation path, or user question.
- "Consider X" or "prefer X" without saying when X is required or what changes if X is unavailable.
- "For compatibility with old X" or "legacy support" without naming the currently supported versions, files, or behavior boundary.
- "If this fails, try another way" without naming the next tool, command, file, owner, or condition for stopping.
- A warning repeated in multiple sections when one source of truth would change the same task-time behavior.

Preserve each asset's job:

- System or environment prompts: preserve priority, safety, tool contracts, session behavior, and project-specific rules; remove workflow detail that belongs in a skill.
- Agents and role instructions: clarify role, input contract, output format, discipline, and failure handling.
- `SKILL.md`: strengthen trigger selection, keep workflow executable, and move supporting detail into bundled resources.
- Skill interface metadata and catalog descriptions: match trigger and scope at summary level; do not promise workflow details absent from the body.
- MCP/tool descriptions: implement the complete Tool and Error Contracts above.

For paired Claude/Codex assets, keep behavior, triggers, validation, and failure handling aligned while preserving actionable adapter-specific mechanics. Edit both sides in the same pass unless the user explicitly confirms one-sided scope.

## Validation

Before finishing, validate every changed prompt asset.

- Re-read the first sentence of every changed section, every `description`, changed interface metadata, and changed catalog descriptions; each must say when to use the asset or what action to take and must not promise workflow details absent from the body.
- Check Markdown links, direct relative paths, and bundled resource paths such as `references/`, `scripts/`, `assets/`, and `agents/`.
- Resolve `SKILL.md` resource paths from the skill directory.
- For prompt templates, classify references as bundled resources or generated-project paths before judging them.
- Fix missing local files, renamed directories, and stale `$skill-name` examples.
- Validate external links only when the user asks or the asset relies on the source; otherwise report them as unchecked.
- Validate frontmatter, changed JSON/YAML, interface metadata, and catalog rows.
- Run the skill validator for changed skills. If unavailable, run manual frontmatter, line-count, resource-path, and paired-behavior checks and report the missing validator.
- For paired assets, confirm behavior is aligned and adapter differences are intentional.
- Check backup `manifest.json` and original hashes; verify `.prompt-asset-improver/local/inventory.json` hashes were refreshed after edits.
- Confirm no unrelated project policy moved into a reusable asset and no one-time task direction was recorded as a custom point.

## Final Report

Start with `User Custom Points` listing active points or `none`. Write user-facing report text in plain language.

Report the scope confirmation source, proposed-change confirmation source, inventory freshness, inventory hash refresh result, backup path, backup manifest status, original hash check, restore method, changed files, sections, metadata keys, catalog rows, validation results, and any skipped gate.

For each changed asset, explain how the change improves task-time behavior and note preserved adapter differences. State the decision for confirmed editable assets left unchanged and check-only counterparts inspected, and report pitfall notes kept or removed when relevant.
