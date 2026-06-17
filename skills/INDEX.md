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
| claude | code-slimming | 0.0.3 | skills/claude/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. |
| claude | complex-plan-workflow | 0.0.3 | skills/claude/complex-plan-workflow | active | Use before coding when work may span sessions, crosses boundaries, changes protocols or lifecycles, needs rollback/isolation, depends on unverified behavior, or has unclear design/user intent. |
| claude | flow-arch-plantuml | 0.0.7 | skills/claude/flow-arch-plantuml | active | Use when the user asks to create or update a flow, architecture, sequence, activity, component, or PlantUML diagram. Focuses on drawing; writes new `.puml` diagrams to an explicit user path or a temporary directory such as `/tmp/flow-arch-plantuml/`, and does not render PNG/SVG. |
| claude | parallel-tasks | 0.0.3 | skills/claude/parallel-tasks | active | Use when a task has 2+ independent tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. Also honor explicit requests to parallelize. Keep agents in the lead's family unless requested otherwise; decompose, route by complexity, run in parallel, then integrate and validate. |
| claude | project-engineering-foundation | 0.0.5 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or when an existing repository lacks the durable engineering structure (CLAUDE.md/AGENTS.md entries, src/build layout, ref/ record indexes). |
| claude | prompt-asset-improver | 0.0.5 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
| codex | code-slimming | 0.0.3 | skills/codex/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. |
| codex | complex-plan-workflow | 0.0.3 | skills/codex/complex-plan-workflow | active | Use before coding when work may span sessions, crosses boundaries, changes protocols or lifecycles, needs rollback/isolation, depends on unverified behavior, or has unclear design/user intent. |
| codex | flow-arch-plantuml | 0.0.7 | skills/codex/flow-arch-plantuml | active | Use when the user asks to create or update a flow, architecture, sequence, activity, component, or PlantUML diagram. Focuses on drawing; writes new `.puml` diagrams to an explicit user path or a temporary directory such as `/tmp/flow-arch-plantuml/`, and does not render PNG/SVG. |
| codex | parallel-tasks | 0.0.3 | skills/codex/parallel-tasks | active | Use when a task has 2+ independent tracks with disjoint write sets, such as separate modules, files, audits, research questions, tests, or implementation areas, that parallel agents can run concurrently. Also honor explicit requests to parallelize. Keep agents in the lead's family unless requested otherwise; decompose, route by complexity, run in parallel, then integrate and validate. |
| codex | project-engineering-foundation | 0.0.5 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or when an existing repository lacks the durable engineering structure (CLAUDE.md/AGENTS.md entries, src/build layout, ref/ record indexes). |
| codex | prompt-asset-improver | 0.0.5 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
