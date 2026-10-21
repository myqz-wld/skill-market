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
| claude | implementation-planning | 0.0.1-draft.4 | skills/claude/implementation-planning | active | Use Claude to plan specific changes using applicable project constraints, with verifiable tasks, dependencies, acceptance, handoffs and archives. |
| claude | project-bootstrap | 0.0.1-draft.14 | skills/claude/project-bootstrap | active | Use Claude to establish runnable project foundations and refactor architecture for AI-led development, with lasting engineering conventions recorded in the project. |
| codex | implementation-planning | 0.0.1-draft.4 | skills/codex/implementation-planning | active | Use Codex to plan specific changes using applicable project constraints, with verifiable tasks, dependencies, acceptance, handoffs and archives. |
| codex | project-bootstrap | 0.0.1-draft.14 | skills/codex/project-bootstrap | active | Use Codex to establish runnable project foundations and refactor architecture for AI-led development, with lasting engineering conventions recorded in the project. |
| grok | implementation-planning | 0.0.1-draft.4 | skills/grok/implementation-planning | active | Use Grok to plan specific changes using applicable project constraints, with verifiable tasks, dependencies, acceptance, handoffs and archives. |
| grok | project-bootstrap | 0.0.1-draft.14 | skills/grok/project-bootstrap | active | Use Grok to establish runnable project foundations and refactor architecture for AI-led development, with lasting engineering conventions recorded in the project. |
