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
| claude | complex-plan-workflow | 0.0.2 | skills/claude/complex-plan-workflow | active | Use before coding when work is risky, design-heavy, cross-session, blocked by an uncertain decision, needs a spike/RFC, or needs durable handoff. |
| claude | flow-arch-plantuml | 0.0.4 | skills/claude/flow-arch-plantuml | active | Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. |
| claude | parallel-tasks | 0.0.1 | skills/claude/parallel-tasks | active | Use when a complex task splits into two or more independent subtasks: decompose, route each subtask to a model tier by complexity, run subtasks on parallel agents, then integrate and validate results. |
| claude | project-engineering-foundation | 0.0.4 | skills/claude/project-engineering-foundation | active | Use when creating a new AI-coding repository or when an existing repository lacks the durable engineering structure (CLAUDE.md/AGENTS.md entries, src/build layout, ref/ record indexes). |
| claude | prompt-asset-improver | 0.0.5 | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
| codex | code-slimming | 0.0.3 | skills/codex/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, symbols, dependencies, repeated logic, merge candidates, or oversized files. |
| codex | complex-plan-workflow | 0.0.2 | skills/codex/complex-plan-workflow | active | Use before coding when work is risky, design-heavy, cross-session, blocked by an uncertain decision, needs a spike/RFC, or needs durable handoff. |
| codex | flow-arch-plantuml | 0.0.4 | skills/codex/flow-arch-plantuml | active | Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. |
| codex | parallel-tasks | 0.0.1 | skills/codex/parallel-tasks | active | Use when a complex task splits into two or more independent subtasks: decompose, route each subtask to a model tier by complexity, run subtasks on parallel agents, then integrate and validate results. |
| codex | project-engineering-foundation | 0.0.4 | skills/codex/project-engineering-foundation | active | Use when creating a new AI-coding repository or when an existing repository lacks the durable engineering structure (CLAUDE.md/AGENTS.md entries, src/build layout, ref/ record indexes). |
| codex | prompt-asset-improver | 0.0.5 | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
