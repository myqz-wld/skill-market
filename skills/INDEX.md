# Skill Catalog

Standalone skills managed by Skill Market live under this directory. The bootstrap `skill-market` management skills stay in `plugins/skill-market-*` so Claude and Codex can install them through their native plugin marketplaces.

This file is the managed skill ledger. A skill listed here is managed by Skill Market; a local skill absent from this ledger is unmanaged and requires user confirmation before disable, update, uninstall, or overwrite operations.

Status values:

- `active`: available for install/update.
- `disabled`: retained in the catalog but not offered for normal install.
- `deprecated`: retained for compatibility or historical reference.
- `removed`: intentionally removed from the market; keep only when a tombstone is useful.

| Adapter | Skill | Path | Status | Description |
|---|---|---|---|---|
