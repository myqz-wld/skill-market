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
| claude | complex-work-planning | 0.0.9 | skills/claude/complex-work-planning | active | Use when explicitly requested; when complex implementation or architecture work is detected before coding, ask whether to start, then resolve user-owned decisions in stages, build a durable plan, and hand off only after review. |
| claude | plantuml-diagrams | 0.0.10 | skills/claude/plantuml-diagrams | active | Use when creating or updating source-backed PlantUML sequence, activity, component, flow, or architecture diagrams. |
| claude | parallel-tasks | 0.0.10 | skills/claude/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets. Inventories dispatch capabilities, selects mechanisms that enforce resolved routing controls, obtains batch approval, then integrates and validates results. |
| claude | project-engineering-foundation | 0.0.12 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata, time-bucketed ref archives, and .ref draft handling. |
| claude | prompt-asset-improver | 0.0.10 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope and proposed changes, refreshes inventory, backs up confirmed editable changes, keeps paired assets and related metadata aligned, and validates resources. |
| codex | complex-work-planning | 0.0.9 | skills/codex/complex-work-planning | active | Use when explicitly requested; when complex implementation or architecture work is detected before coding, ask whether to start, then resolve user-owned decisions in stages, build a durable plan, and hand off only after review. |
| codex | plantuml-diagrams | 0.0.10 | skills/codex/plantuml-diagrams | active | Use when creating or updating source-backed PlantUML sequence, activity, component, flow, or architecture diagrams. |
| codex | parallel-tasks | 0.0.10 | skills/codex/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets. Inventories dispatch capabilities, selects mechanisms that enforce resolved routing controls, obtains batch approval, then integrates and validates results. |
| codex | project-engineering-foundation | 0.0.12 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata, time-bucketed ref archives, and .ref draft handling. |
| codex | prompt-asset-improver | 0.0.10 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope and proposed changes, refreshes inventory, backs up confirmed editable changes, keeps paired assets and related metadata aligned, and validates resources. |
