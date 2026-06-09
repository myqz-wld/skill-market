---
name: prompt-asset-improver
description: "Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. Confirms scope, refreshes inventory, creates local backups, assigns each editing agent exactly one file or one paired counterpart group when supported, removes stale/duplicated/vague rules, aligns paired assets, records only durable custom criteria, and validates with a review agent."
---

# Prompt Asset Improver

Use this skill before editing durable AI-facing text. The reader is another agent or user at task time, so every section must answer what to do and when to use it before explaining implementation details.

## Scope

Apply this skill to:

- System or environment prompts.
- Agent bodies and role instructions.
- `SKILL.md` files and skill metadata.
- MCP/tool descriptions visible to agents.
- Long-lived prompt references bundled with a product or repository.

Do not apply this skill to source-code comments, project scaffolds, generated documentation snapshots, transient reviewer prompts, or one-off handoff messages unless the user asks to turn them into durable assets.

## Scope Confirmation

Before optimizing prompt assets, confirm the edit scope with the user even when a fresh inventory already exists. Inventory helps describe assets; it never authorizes scope expansion by itself.

1. If the user's current request names exact prompt assets, treat those named assets as the confirmed scope and repeat that scope before editing.
2. If the request names a directory, product area, broad asset class, or vague problem, scan the likely target roots, present the proposed included and excluded paths, ask the user to confirm, and stop before editing until the user answers.
3. If the audit shows duplicated rules, paired counterparts, or affected assets outside the confirmed scope, ask the user to expand or keep the scope before editing those extra assets.
4. Record the confirmation source in the optimization report: exact user-named assets, user-approved scan, or user-approved scope expansion.

## Inventory Cache

After scope confirmation, establish the prompt-asset inventory for every target root.

1. Choose the target root as the repository, workspace, or user config root that owns the prompt assets. Do not use a single changed file's directory when that would create fragmented caches.
2. Create or reuse `<target-root>/.prompt-asset-improver/` for scan data.
3. Split records into `shared/` (non-local) and `local/`:
   - `shared/` stores non-local project-level inventory and optimization points only after the user confirms they belong with the project.
   - `local/` stores machine-specific scan cache, private user preferences, and local exclusions. Never commit local data.
4. Read `shared/` and `local/` together. Merge shared data first, then local additions, exclusions, and custom points. Reports must show which source supplied each custom point or exclusion.
5. In a git repo, add `.prompt-asset-improver/local/` to `.gitignore` before writing local data. If generated shared data is not approved as project data, keep it in `local/` or ignore the exact generated shared paths; do not leave accidental untracked cache files.
6. Store inventory metadata in `inventory.json`: `root`, `scanned_at`, `expires_at`, `scan_reason`, `git_head` when available, and assets with `path`, `type`, `scope`, and `reason`.

Use a 7-day default expiry. Treat inventory as expired when it is missing, lacks `expires_at`, has an `expires_at` before the current date, points at a different root, lists missing files, or the user says the asset set changed.

## Inventory Refresh

Use inventory to support the confirmed scope; do not use it to replace user scope confirmation.

1. For exact user-named assets, refresh inventory entries for those files after the edit.
2. For user-approved directory or product-area scopes, scan the target root for durable prompt assets. Include system prompts, agent files, `SKILL.md`, MCP/tool descriptions, role instructions, and project/user prompt entry points such as `AGENTS.md` or `CLAUDE.md`.
3. Exclude dependency directories, build outputs, VCS internals, generated caches, logs, and transient conversation files.
4. Use the grouped inventory as evidence for the scope confirmation: show path, asset type, and local/shared source, and ask whether proposed shared data belongs in the project.
5. If the edit affects duplicated or unknown prompt assets outside the confirmed scope, stop and ask whether to expand the scope.
6. After confirmed editing, write the refreshed inventory with a new `expires_at`.

## Backup And Restore

Before editing prompt assets, create a local backup and prune old local backups for the confirmed scope.

1. Back up every prompt asset file planned for possible modification before the first edit in the turn.
2. Store backups under `<target-root>/.prompt-asset-improver/local/backups/<timestamp>/`; local backup data never enters project history.
3. Include a `manifest.json` with `created_at`, `root`, `reason`, and files containing `original_path`, `backup_path`, and a content hash when hashing tools are available.
4. Do not overwrite an existing backup directory. If backup creation fails, stop and ask the user before editing.
5. After writing the current backup manifest and before editing, prune old backup directories under `<target-root>/.prompt-asset-improver/local/backups/`.
6. Use this retention rule: keep the current backup, every manifest-backed backup created in the last 7 days, and at least the newest 10 manifest-backed backup directories.
7. Delete only backup directories whose names match `YYYYMMDDTHHMMSSZ` and contain `manifest.json`. Leave unrecognized directories, directories without manifests, and directories outside the backup root untouched; mention them in the report when they block cleanup.
8. If pruning fails for a specific directory, leave it in place, continue only after the current backup is valid, and report the unpruned path.
9. To restore, choose a backup directory, copy each `backup_path` back to its `original_path`, then re-run the dead-link check and validation for the restored files.
10. Include the backup id/path, pruning summary, and restore note in the optimization report.

## Custom Points

Use custom points only for durable optimization criteria intended to apply to later prompt-asset runs.

1. Before recording a point, decide whether the user gave a standing preference or a one-time direction for the current task.
2. Record standing preferences in `.prompt-asset-improver/local/custom-points.md` unless the user explicitly marks them project-level; project-level points go in `shared/custom-points.md`.
3. Do not record one-time task directions, direct edits requested for the current asset, or requirements already covered by this skill. Apply them in the current run and mention them in the report when they affected the edit.
4. Keep the user's wording, date, source, and scope. Deduplicate repeated standing preferences without changing meaning.
5. Load both shared and local custom points before every optimization.
6. Include active custom points in every optimization report.

## Self-Improvement Queue

When review work reveals a weakness in this skill itself, queue it instead of silently changing the skill.

1. Record the candidate in `.prompt-asset-improver/local/skill-improvements.md` with date, evidence, affected section, and proposed rule change. Use `shared/skill-improvements.md` only when the user says the proposal belongs with the project.
2. At the start of this workflow, read pending self-improvement candidates and ask the user to choose `add to skill`, `discard`, or `keep pending` for each candidate before editing other prompt assets.
3. If the user chooses `add to skill`, update the skill and remove the candidate from the queue. If the user chooses `discard`, remove the candidate from the queue. If the user chooses `keep pending`, leave the candidate unchanged.
4. Record accepted and discarded outcomes in the current optimization report, not in the queue document.
5. If no pending candidates remain, delete `skill-improvements.md` instead of keeping an empty or resolved-history file.
6. Do not apply self-improvement candidates without explicit user confirmation.
7. Use review agent for the final self-improvement audit. Review agent checks whether the edit revealed a weakness in this skill, whether a queued candidate is needed, and whether any direct skill change requires user confirmation.

## Editing Rules

1. Keep one source of truth for each rule. Replace duplicated copies with cross-references only when the target reader is guaranteed to load the referenced asset or the current asset still contains the executable rule needed at task time. For separately loaded runtime assets, replace broad config-section pointers with the local executable rule or a narrow reference to a guaranteed loaded source.
2. Write current facts only. Remove deprecated, transitional, future-looking, compatibility, old-structure, or migration prose. Do not keep "before directory X existed", "old path still works", or "migrate later" notes. If an old behavior still affects the agent's next action, rewrite it as a current executable rule without historical framing.
3. Use executable language: "do X", "reject Y", "run Z". Replace vague advice with explicit boundaries.
4. Keep fallback handling only when it changes the agent's next action. Move defensive implementation details back to code comments.
5. Keep prompt text dense and short. Preserve the rule, trigger, boundary, and action; remove wording that does not change model behavior.
6. Use plain language. Prefer words a user and an agent can both understand over internal jargon, long noun chains, or unexplained protocol names.
7. Write new or revised prompt asset text in English by default. Use another language only when the user requests it, the target audience needs it, the asset is product-facing copy in that language, the existing project convention is non-English, or preserving quoted/source text requires it.
8. Use one language for prompt assets in the same asset type or domain. Pick the language from the confirmed audience, product convention, or dominant existing set; if a specific asset needs a different language, state the audience or source-text boundary in that asset or the report.
9. Keep pitfall notes only when they include evidence such as an incident, issue id, failing command, file path, or user decision. During each optimization, list pitfall notes without evidence and ask the user whether to remove them.
10. Keep examples sparse. One or two representative examples are enough for a rule.
11. Put trigger information in skill or agent frontmatter descriptions, not only in the body. The body loads after trigger selection.
12. Write frontmatter descriptions as positive trigger and capability signals. Omit mentions of unrelated tools, products, environments, or excluded capabilities unless that boundary changes trigger selection; when the boundary matters, state the active scope instead of listing incidental exclusions.
13. Do not make a general prompt asset assume another skill, plugin, product, or tool exists. Name another capability only when this asset is the integration point, the user scoped the edit to that environment, or the dependency changes trigger selection; otherwise describe the capability contract generically.
14. Do not make a reusable or non-project-specific prompt asset read like it belongs to one repository, product, vendor, file layout, or incident. Keep project names, file names, regexes, and incident details in project-level custom points, local reports, or assets whose confirmed scope is that project.
15. Keep `SKILL.md` lean. Move detailed references into `references/`, executable repeat work into `scripts/`, and output assets into `assets/`.
16. For paired Claude/Codex assets, find the counterpart before editing one side. Edit both sides in the same pass or record that no counterpart exists; keep behavior, triggers, validation, and failure handling aligned while allowing differences only for adapter tools, turn boundaries, and file-edit mechanics. Do not label one side as a Claude or Codex perspective; let the file path and load path imply the adapter, and state only actionable adapter-specific mechanics.

## Asset-Specific Focus

Optimize each asset type for its job.

- System or environment prompts: preserve priority, safety boundaries, tool contracts, session behavior, and project-specific rules. Remove workflow detail that belongs in a skill.
- Agents and role instructions: clarify role, input contract, output format, discipline, and failure handling that changes the next action.
- `SKILL.md` files: strengthen the frontmatter trigger, keep the workflow executable, separate reusable references into `references/`, and keep the body small enough to scan.
- MCP/tool descriptions: state when to call the tool, required parameters, permission boundaries, and errors that change the caller's next step.

## Dead Link Check

Before finishing prompt-asset edits, check changed assets for dead local references.

1. Check Markdown links, direct relative file references, and skill resource paths such as `references/`, `scripts/`, `assets/`, and `agents/`.
2. Resolve relative paths from the file that contains the reference. For `SKILL.md`, resolve bundled resource paths from the skill directory.
3. For prompt templates that generate files in another location, classify each reference before judging it: bundled skill resources resolve from the skill directory; generated-project references resolve from the documented output path. If the output path is unknown, write the reference as code-path text instead of a Markdown link and report the trade-off.
4. Treat missing local files, renamed directories, and stale `$skill-name` examples as defects to fix before finishing.
5. For external `http` or `https` links, validate them only when the user asks for external link validation or the prompt asset relies on the linked source. Otherwise list them as external links not checked.
6. Include dead-link findings and fixes in the optimization report.

## Pre-Edit Audit

Before changing a prompt asset, run a targeted audit and carry the results into the optimization report.

1. Confirm the user-approved scope, refresh or load inventory, load custom points, and process pending self-improvement candidates.
2. Search only changed files and related prompt-asset directories where the same rule can be duplicated. Do not scan session logs, dependency directories, generated caches, or whole home directories.
3. Use concrete changed names, section titles, rule phrases, cache paths, and skill invocation names as search terms. Do not run placeholder searches.
4. Check these categories:
   - duplicate rules or repeated key phrases;
   - stale, compatibility, migration, old-structure, or future-looking language;
   - vague advice that needs an exact action or exception boundary;
   - non-English prose without a user, audience, product-copy, project-convention, or quoted-source reason;
   - language drift across prompt assets that share an asset type or domain;
   - frontmatter descriptions with unnecessary unrelated-tool or excluded-capability mentions;
   - general assets that assume another skill, plugin, product, or tool exists;
   - paired Claude/Codex assets that need synchronized edits or a documented no-counterpart decision;
   - paired Claude/Codex assets that label themselves as a Claude or Codex perspective instead of relying on file/load path;
   - repeated examples that do not teach a different decision;
   - pitfall notes without evidence;
   - local references, bundled resource paths, external links, and stale skill invocation names;
   - broad section-level references from independently loaded assets to repository-local config, policy, or runtime files that can hide missing executable rules. Use target-specific search terms from the changed asset, then fix hits by keeping the actionable rule local or documenting that the referenced source is guaranteed loaded;
   - prompt-template references that must be validated against a generated output path instead of the template source path.
5. Fix local dead links before finishing. Report unchecked external links.
6. If `rg` is unavailable, use the nearest search tool and record that the search check was manual.

## Editing Agent Batches

After the pre-edit audit and before changing prompt assets, split the confirmed scope into editing-agent batches.

1. Make the default batch exactly one prompt asset file.
2. If files must stay behaviorally aligned, make one counterpart-group batch and keep those paired files together. Common groups include Claude/Codex counterparts, localized variants of the same rule, or source/template files that must change together.
3. Do not give an editing agent a broad domain, directory, or mixed issue list. Split broad findings into one-file or one-counterpart-group batches first.
4. If one file has several issue types, keep them with the one owner for that file. If one counterpart group has several issue types, keep them with the one owner for that group.
5. Spawn one editing agent per batch when the environment supports editing agents or sub-agents and the batch has a disjoint write set. Give exact file paths, confirmed scope, audit evidence, backup location, editing rules, and required final summary.
6. Tell each editing agent to preserve unrelated changes, avoid touching files outside its batch, and report changed paths and unresolved concerns.
7. Keep scope confirmation, backups, inventory writes, conflict resolution, final validation, and the optimization report with the lead agent. The lead agent reviews every agent result, integrates or rejects changes, and produces the final summary.
8. If agent spawning is unavailable or all safe batches must remain with the lead agent, edit locally and report why delegation was skipped.

## Skill Extraction

When a prompt section is reusable and weakly tied to its current environment, extract it into a standalone skill:

1. Name the skill with lowercase hyphen-case.
2. Put trigger contexts in `description`.
3. Keep environment-specific protocol, paths, credentials, session behavior, and tool names in the original environment prompt.
4. Move reusable workflow, review policy, and repeated procedure into the skill.
5. Replace the original long section with a short pointer to the skill and a boundary note for environment-specific behavior.
6. Validate the new skill with the local skill validator.

## Review-Agent Validation

Before finishing prompt-asset edits, assign validation to review agent. The editing agent runs local checks, and review agent independently decides whether the overall change matches the user's intent and this skill's rules.

The review agent must check:

- The changed prompt assets answer the user's request without adding unrelated policy or hidden dependencies.
- The scope is correct, and any paired Claude/Codex counterpart is updated or explicitly reported as absent.
- The edits follow the English-by-default rule and preserve justified non-English text only when an exception applies.
- Same-type or same-domain prompt assets use one language, with any exception tied to audience, product convention, or quoted/source text.
- General assets do not assume unrelated skills, plugins, products, or tools exist.
- Paired assets avoid perspective labels and preserve only actionable adapter-specific mechanics.
- Local links, bundled resource paths, frontmatter, inventory, backups, backup retention pruning, and manifests are valid.
- Editing-agent batches used exactly one file or one paired counterpart group per agent, or delegation was skipped with a concrete reason.
- The self-improvement audit is complete and any needed candidate is queued instead of silently applied.

If no review agent is available in the current environment, run the manual validation yourself, mark the validation as self-reviewed in the optimization report, and state what review-agent coverage is missing.

## Optimization Report

After every prompt-asset optimization, deliver a final optimization report.

1. Start the report with `User Custom Points`. List active shared and local custom points first. If none exist, write `None recorded`.
2. Include scope confirmation method, inventory freshness, confirmed assets, backup id/path, backup pruning result, editing-agent batch assignments, skipped-delegation reasons, aggregation result, changed files, pitfall-note decisions, dead-link results, review-agent validation results, pending self-improvement candidates, and any self-improvement decisions made in the current run.
3. For each changed asset, include a compact but specific change summary that is detailed enough to be useful, not overly brief: name the changed sections or rule names, summarize the actual rule/content changes, explain why the change improves the prompt for its intended reader, and note any adapter-specific divergence preserved.
4. If no file changed, still report the inventory/custom-point decisions and the reason no edit was made.
5. Keep the report short enough to scan; do not paste full prompt files.

## Final Check

Before finishing:

- Re-read the first sentence of every changed section and every `description`.
- Confirm each one says what the asset does and when to use it.
- Confirm the final response includes the optimization report and starts it with user custom points.
- Confirm the report summary is concise but not overly brief; it must identify the changed sections, actual content shift, and reader-facing effect.
- Confirm the report includes the backup id/path and pruning result, or explains why no backup was created.
- Confirm scope was explicitly approved by the user or came from exact prompt assets named in the current user request; inventory freshness did not expand the scope.
- Confirm no unrelated project-specific policy moved into a general skill.
- Confirm new or revised prompt text uses English by default, and any non-English text has a user, audience, product-copy, project-convention, or quoted-source reason.
- Confirm same-type or same-domain prompt assets use one language, or the report states the exception boundary.
- Confirm no general asset assumes another unrelated skill, plugin, product, or tool exists.
- Confirm custom points contain only standing preferences, not one-time task directions.
- Confirm processed self-improvement candidates were removed from the queue document.
- Confirm editing-agent batches were created after scanning, each editing agent owned exactly one file or one paired counterpart group, and the lead agent aggregated the results; if skipped, confirm the report gives the reason.
- For paired Claude/Codex assets, check both sides, remove perspective labels, and keep protocol semantics aligned while preserving actionable adapter-specific wording or report that no counterpart exists.
- Run the skill validator for changed skills. If the validator is unavailable, run manual frontmatter and line-count checks and report the validator failure.
- Run the remaining local validation checks needed for the changed files, then send the overall change to review agent for independent validation and self-improvement audit. If no review agent is available, report the missing review-agent coverage and mark the result as self-reviewed.
