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
| claude | implementation-planning | 0.0.1-draft.3 | skills/claude/implementation-planning | active | Use Claude to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| claude | project-bootstrap | 0.0.1-draft.13 | skills/claude/project-bootstrap | active | Use Claude to deliver runnable scaffolds or architecture refactors for AI-led development, with selectable reference layers, searchable project knowledge, native verification, language/privacy policy, isolated environments and concrete evolution guidance. |
| codex | implementation-planning | 0.0.1-draft.3 | skills/codex/implementation-planning | active | Use Codex to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| codex | project-bootstrap | 0.0.1-draft.13 | skills/codex/project-bootstrap | active | Use Codex to deliver runnable scaffolds or architecture refactors for AI-led development, with selectable reference layers, searchable project knowledge, native verification, language/privacy policy, isolated environments and concrete evolution guidance. |
| grok | implementation-planning | 0.0.1-draft.3 | skills/grok/implementation-planning | active | Use Grok to plan substantial code changes within existing architecture, split independently verifiable tasks, identify safe parallel batches, and prepare handoff, archive and later audit records. |
| grok | project-bootstrap | 0.0.1-draft.13 | skills/grok/project-bootstrap | active | Use Grok to deliver runnable scaffolds or architecture refactors for AI-led development, with selectable reference layers, searchable project knowledge, native verification, language/privacy policy, isolated environments and concrete evolution guidance. |
