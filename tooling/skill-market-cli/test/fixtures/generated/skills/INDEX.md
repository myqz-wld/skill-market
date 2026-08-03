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
| claude | fixture-skill | 0.0.1 | skills/claude/fixture-skill | active | Claude fixture skill. |
| codex | fixture-skill | 0.0.1 | skills/codex/fixture-skill | active | Codex fixture skill. |
| grok | fixture-skill | 0.0.1 | skills/grok/fixture-skill | active | Grok fixture skill. |
