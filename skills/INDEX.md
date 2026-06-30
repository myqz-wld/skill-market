# Skill Catalog

Standalone skills published by Skill Market live under this directory. The bootstrap `skill-market` management skills stay in `plugins/skill-market-*` so Claude and Codex can install them through their native plugin marketplaces.

This file is the remote skill catalog index. It records market entries, catalog versions, and catalog status only. Local install/disable/update state is stored on the user's machine in `~/.skill-market/managed-skills.json`.

Skill versions use semver strings. Start new standalone skills at `0.0.1` and bump the version whenever the published skill package changes.

Catalog status values:

- `active`: available for install/update.
- `disabled`: retained in the catalog but not offered for normal install.
- `deprecated`: retained for compatibility or historical reference.
- `removed`: intentionally removed from the market; keep only when a tombstone is useful.

| Adapter | Skill | Version | Path | Status | Description |
|---|---|---|---|---|---|
| claude | code-slimming | 0.0.4 | skills/claude/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. |
| claude | complex-plan-workflow | 0.0.5 | skills/claude/complex-plan-workflow | active | Use before coding when work may span sessions, crosses boundaries, needs rollback/isolation, depends on unverified behavior, or has unclear design/user intent. Splits plans into tasks and tracks progress for handoff. |
| claude | diff-walkthrough | 0.0.3 | skills/claude/diff-walkthrough | active | Use when walking a user through pull-request diffs or merge-conflict resolutions one fragment at a time with explanation and confirmation before continuing. |
| claude | flow-arch-plantuml | 0.0.9 | skills/claude/flow-arch-plantuml | active | Use when creating or updating PlantUML flow, architecture, sequence, activity, or component diagrams from source evidence. |
| claude | parallel-tasks | 0.0.7 | skills/claude/parallel-tasks | active | Use when a task has 2+ independent tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. Also honor explicit requests to parallelize. Keep agents in the lead's family unless requested otherwise; decompose, route by complexity, run in parallel, then integrate and validate. |
| claude | project-engineering-foundation | 0.0.11 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata. |
| claude | prompt-asset-improver | 0.0.8 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope, inventories and backs up assets, chooses edit and review mode by risk, keeps paired assets aligned, and validates resources. |
| codex | code-slimming | 0.0.4 | skills/codex/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. |
| codex | complex-plan-workflow | 0.0.5 | skills/codex/complex-plan-workflow | active | Use before coding when work may span sessions, crosses boundaries, needs rollback/isolation, depends on unverified behavior, or has unclear design/user intent. Splits plans into tasks and tracks progress for handoff. |
| codex | diff-walkthrough | 0.0.3 | skills/codex/diff-walkthrough | active | Use when walking a user through pull-request diffs or merge-conflict resolutions one fragment at a time with explanation and confirmation before continuing. |
| codex | flow-arch-plantuml | 0.0.9 | skills/codex/flow-arch-plantuml | active | Use when creating or updating PlantUML flow, architecture, sequence, activity, or component diagrams from source evidence. |
| codex | parallel-tasks | 0.0.7 | skills/codex/parallel-tasks | active | Use when a task has 2+ independent tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. Also honor explicit requests to parallelize. Keep agents in the lead's family unless requested otherwise; decompose, route by complexity, run in parallel, then integrate and validate. |
| codex | project-engineering-foundation | 0.0.11 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata. |
| codex | prompt-asset-improver | 0.0.8 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope, inventories and backs up assets, chooses edit and review mode by risk, keeps paired assets aligned, and validates resources. |
