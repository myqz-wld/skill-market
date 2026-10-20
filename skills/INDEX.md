# Skill Catalog

Standalone skills published by Skill Market live under this directory. Bootstrap management skills stay under `plugins/skill-market-*` and are installed through each adapter's native plugin marketplace.

This file is generated from `catalog/entries.json`. It records catalog identity, versions, paths, status, and descriptions only. Local installation state is stored under `~/.skill-market/`.

Skill versions use semver strings. Start at `0.0.1` or a prerelease such as `0.0.1-draft.1`; keep all versions under the same adapter/skill path. Bump the version whenever the published package changes.

Catalog status values:

- `active`: available for normal install and update.
- `deprecated`: hidden from normal new installs unless explicitly requested.
- `disabled`: retained in the catalog but unavailable for install or update.
- `removed`: a tombstone for a package intentionally removed from the market.

| Adapter | Skill | Version | Path | Status | Description |
|---|---|---|---|---|---|
| claude | implementation-planning | 0.0.1-draft.1 | skills/claude/implementation-planning | active | Use Claude to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| claude | project-bootstrap | 0.0.1-draft.3 | skills/claude/project-bootstrap | active | Use Claude for new-project scaffolding or existing-project architecture adjustment by asking consequential questions and choosing reversible engineering defaults. Adds task/history navigation and structural verification; does not implement new product features. |
| codex | implementation-planning | 0.0.1-draft.1 | skills/codex/implementation-planning | active | Use Codex to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| codex | project-bootstrap | 0.0.1-draft.3 | skills/codex/project-bootstrap | active | Use Codex for new-project scaffolding or existing-project architecture adjustment by asking consequential questions and choosing reversible engineering defaults. Adds task/history navigation and structural verification; does not implement new product features. |
| grok | implementation-planning | 0.0.1-draft.1 | skills/grok/implementation-planning | active | Use Grok to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| grok | project-bootstrap | 0.0.1-draft.3 | skills/grok/project-bootstrap | active | Use Grok for new-project scaffolding or existing-project architecture adjustment by asking consequential questions and choosing reversible engineering defaults. Adds task/history navigation and structural verification; does not implement new product features. |
