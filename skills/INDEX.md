# Skill Catalog

Standalone skills published by Skill Market live under this directory. Bootstrap management skills stay under `plugins/skill-market-*` and are installed through each adapter's native plugin marketplace.

This file is generated from `catalog/entries.json`. It records catalog identity, versions, paths, status, and descriptions only. Local installation state is stored under `~/.skill-market/`.

Skill versions use semver strings. Start new standalone skills at `0.0.1` and bump the version whenever the published package changes.

Catalog status values:

- `active`: available for normal install and update.
- `deprecated`: hidden from normal new installs unless explicitly requested.
- `disabled`: retained in the catalog but unavailable for install or update.
- `removed`: a tombstone for a package intentionally removed from the market.

| Adapter | Skill | Version | Path | Status | Description |
|---|---|---|---|---|---|
| claude | complex-work-planning | 0.0.10 | skills/claude/complex-work-planning | active | Use when explicitly requested; when complex implementation or architecture work is detected before coding, ask whether to start, then resolve user-owned decisions in stages, build a durable plan, and hand off only after review. |
| claude | parallel-tasks | 0.0.10 | skills/claude/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets. Inventories dispatch capabilities, selects mechanisms that enforce resolved routing controls, obtains batch approval, then integrates and validates results. |
| claude | plantuml-diagrams | 0.0.10 | skills/claude/plantuml-diagrams | active | Use when creating or updating source-backed PlantUML sequence, activity, component, flow, or architecture diagrams. |
| claude | project-engineering-foundation | 0.0.13 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata, time-bucketed ref archives, .ref draft handling, and repository-relative path privacy for AI-facing records. |
| claude | prompt-asset-improver | 0.0.11 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope and proposed changes, refreshes inventory, backs up confirmed editable changes, keeps paired assets and related metadata aligned, and validates resources. |
| codex | complex-work-planning | 0.0.10 | skills/codex/complex-work-planning | active | Use when explicitly requested; when complex implementation or architecture work is detected before coding, ask whether to start, then resolve user-owned decisions in stages, build a durable plan, and hand off only after review. |
| codex | parallel-tasks | 0.0.10 | skills/codex/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets. Inventories dispatch capabilities, selects mechanisms that enforce resolved routing controls, obtains batch approval, then integrates and validates results. |
| codex | plantuml-diagrams | 0.0.10 | skills/codex/plantuml-diagrams | active | Use when creating or updating source-backed PlantUML sequence, activity, component, flow, or architecture diagrams. |
| codex | project-engineering-foundation | 0.0.13 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata, time-bucketed ref archives, .ref draft handling, and repository-relative path privacy for AI-facing records. |
| codex | prompt-asset-improver | 0.0.11 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope and proposed changes, refreshes inventory, backs up confirmed editable changes, keeps paired assets and related metadata aligned, and validates resources. |
| grok | complex-work-planning | 0.0.10 | skills/grok/complex-work-planning | active | Use when explicitly requested; when complex implementation or architecture work is detected before coding, ask whether to start, then resolve user-owned decisions in stages, build a durable plan, and hand off only after review. |
| grok | parallel-tasks | 0.0.10 | skills/grok/parallel-tasks | active | Use when the lead already has 2+ independent tasks or work tracks with disjoint write sets. Inventories dispatch capabilities, selects mechanisms that enforce resolved routing controls, obtains batch approval, then integrates and validates results. |
| grok | plantuml-diagrams | 0.0.10 | skills/grok/plantuml-diagrams | active | Use when creating or updating source-backed PlantUML sequence, activity, component, flow, or architecture diagrams. |
| grok | project-engineering-foundation | 0.0.13 | skills/grok/project-engineering-foundation | active | Use when creating a new AI-coding repository or conservatively inspecting and repairing an existing repo's durable engineering structure, including installable artifact build metadata, time-bucketed ref archives, .ref draft handling, and repository-relative path privacy for AI-facing records. |
| grok | prompt-asset-improver | 0.0.11 | skills/grok/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets; confirms scope and proposed changes, refreshes inventory, backs up confirmed editable changes, keeps paired assets and related metadata aligned, and validates resources. |
