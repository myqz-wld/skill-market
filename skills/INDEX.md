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
| claude | complex-work-planning | 0.0.6 | skills/claude/complex-work-planning | active | Use when explicitly requested; when detecting complex implementation, architecture changes, or other large-scale code changes before coding, ask whether to start this skill, then coordinate planning across sessions if needed and hand off to isolated implementation only after plan completion. |
| claude | flow-arch-plantuml | 0.0.9 | skills/claude/flow-arch-plantuml | active | Use when creating or updating PlantUML flow, architecture, sequence, activity, or component diagrams from source evidence. |
| claude | parallel-tasks | 0.0.8 | skills/claude/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets that parallel agents can run concurrently. Coordinates assignment, model routing, parallel execution, integration, and validation; does not discover or decompose a single task into tasks. |
| claude | project-engineering-foundation | 0.0.11 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata. |
| claude | prompt-asset-improver | 0.0.8 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope, inventories and backs up assets, chooses edit and review mode by risk, keeps paired assets aligned, and validates resources. |
| codex | complex-work-planning | 0.0.6 | skills/codex/complex-work-planning | active | Use when explicitly requested; when detecting complex implementation, architecture changes, or other large-scale code changes before coding, ask whether to start this skill, then coordinate planning across sessions if needed and hand off to isolated implementation only after plan completion. |
| codex | flow-arch-plantuml | 0.0.9 | skills/codex/flow-arch-plantuml | active | Use when creating or updating PlantUML flow, architecture, sequence, activity, or component diagrams from source evidence. |
| codex | parallel-tasks | 0.0.8 | skills/codex/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets that parallel agents can run concurrently. Coordinates assignment, model routing, parallel execution, integration, and validation; does not discover or decompose a single task into tasks. |
| codex | project-engineering-foundation | 0.0.11 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata. |
| codex | prompt-asset-improver | 0.0.8 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope, inventories and backs up assets, chooses edit and review mode by risk, keeps paired assets aligned, and validates resources. |
