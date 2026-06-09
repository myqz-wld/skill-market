# Skill Catalog

Standalone skills published by Skill Market live under this directory. The bootstrap `skill-market` management skills stay in `plugins/skill-market-*` so Claude and Codex can install them through their native plugin marketplaces.

This file is the remote skill catalog index. It records market entries and catalog status only. Local install/disable/update state is stored on the user's machine in `~/.skill-market/managed-skills.json`.

Catalog status values:

- `active`: available for install/update.
- `disabled`: retained in the catalog but not offered for normal install.
- `deprecated`: retained for compatibility or historical reference.
- `removed`: intentionally removed from the market; keep only when a tombstone is useful.

| Adapter | Skill | Path | Status | Description |
|---|---|---|---|---|
| claude | code-slimming | skills/claude/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, functions, classes, exports, dependencies, repeated logic, or consolidation opportunities. |
| claude | complex-plan-workflow | skills/claude/complex-plan-workflow | active | Use before coding when work is risky, design-heavy, multi-session, blocked by an uncertain decision, needs a spike/RFC, or needs a durable plan for handoff. |
| claude | flow-arch-plantuml | skills/claude/flow-arch-plantuml | active | Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. |
| claude | project-engineering-foundation | skills/claude/project-engineering-foundation | active | Use when starting or maintaining a long-lived AI-coding repository. |
| claude | prompt-asset-improver | skills/claude/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
| codex | code-slimming | skills/codex/code-slimming | active | Use when asked to slim, shrink, deduplicate, or clean code by finding unused files, functions, classes, exports, dependencies, repeated logic, or consolidation opportunities. |
| codex | complex-plan-workflow | skills/codex/complex-plan-workflow | active | Use before coding when work is risky, design-heavy, multi-session, blocked by an uncertain decision, needs a spike/RFC, or needs a durable plan for handoff. |
| codex | flow-arch-plantuml | skills/codex/flow-arch-plantuml | active | Use when the user asks for a flow/architecture diagram or a change affects a core workflow, state machine, protocol, process boundary, schema, permission boundary, or module architecture. |
| codex | project-engineering-foundation | skills/codex/project-engineering-foundation | active | Use when starting or maintaining a long-lived AI-coding repository. |
| codex | prompt-asset-improver | skills/codex/prompt-asset-improver | active | Use before editing durable AI-facing prompt assets such as system prompts, agent instructions, SKILL.md files, MCP/tool descriptions, and long-lived prompt references. |
