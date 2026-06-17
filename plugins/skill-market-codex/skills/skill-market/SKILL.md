---
name: skill-market
description: Route general Codex Skill Market requests to the focused list, search, download, install, disable, uninstall, update, or upload skills.
---

# Skill Market for Codex

Use this entry point to choose the focused Codex Skill Market management skill. Dispatch actual work to one of these skills:

- `skill-list`: list skills already managed by Skill Market.
- `skill-search`: search plugins and standalone Codex skills.
- `skill-download`: download a package without installing it.
- `skill-install`: install a plugin or standalone Codex skill.
- `skill-disable`: disable a local installation while preserving files.
- `skill-uninstall`: remove a local installation.
- `skill-update`: update a local installation from the remote catalog.
- `skill-upload`: create a branch and PR for uploads or marketplace deletions.

## Repository and Configuration

All focused skills use the remote repository as source of truth and the local cache only as a working copy.

- Default `repoUrl`: `git@github.com:myqz-wld/skill-market.git`.
- Default `cachePath`: `~/.skill-market/cache/skill-market`.
- Default `cacheTtlSeconds`: `86400`; `0` disables automatic TTL refresh.
- Required config file: `~/.skill-market/config.json`. Create it with the defaults before any operation that reads the remote or cache if it is missing.
- Precedence: environment variable > config field > default. Use `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `SKILL_MARKET_CACHE_TTL_SECONDS` for the three defaults above.
- `SKILL_MARKET_REPO` or config `repoPath` is only an explicit local development checkout override; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, marker writes, and TTL.

When `repoPath` is not selected, `skill-list`, `skill-search`, `skill-download`, and `skill-install` clone the cache when missing and fetch when the user asks for latest or the cache marker is missing or older than `cacheTtlSeconds`. `skill-update` and `skill-upload` always fetch before changing local state or creating PRs. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`.

When the user asks about Skill Market configuration, read the current config and the four environment variables, report each effective value and source, and flag unknown fields or invalid values.

## Storage

- Bootstrap management skills live inside `plugins/skill-market-codex/skills/`.
- Managed standalone Codex skills live under `skills/codex/`.
- Codex plugins are listed in `.agents/plugins/marketplace.json` and live under `plugins/`.

Upload is not publish. A skill or plugin is published only after its PR is merged.

`skills/INDEX.md` is the remote skill catalog index and records each standalone skill's catalog `Version`, status, path, and description. Local Codex management state lives in `~/.skill-market/managed-skills.json` and records each installed standalone skill's `installedVersion`.

Only skills installed through Skill Market or explicitly adopted by the user are managed. Do not list unrelated local Codex skills. If a requested operation touches a local skill absent from `managed-skills.json`, ask the user before adopting or modifying it.
