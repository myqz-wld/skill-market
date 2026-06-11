---
name: skill-market
description: Route general Claude Skill Market requests to the focused list, search, download, install, disable, uninstall, update, or upload skills.
disable-model-invocation: true
---

# Skill Market for Claude

Use this entry point to choose the focused Claude Skill Market management skill. Dispatch actual work to one of these skills:

- `skill-list`: list skills already managed by Skill Market.
- `skill-search`: search plugins and standalone Claude skills.
- `skill-download`: download a package without installing it.
- `skill-install`: install a plugin or standalone Claude skill.
- `skill-disable`: disable a local installation while preserving files.
- `skill-uninstall`: remove a local installation.
- `skill-update`: update a local installation from the remote catalog.
- `skill-upload`: create a branch and PR for uploads or marketplace deletions.

## Repository Model

The remote repository is the source of truth. The default remote is:

```text
git@github.com:myqz-wld/skill-market.git
```

The local cache is only a working copy. The default cache path is:

```text
~/.skill-market/cache/skill-market
```

For `skill-list`, `skill-search`, `skill-download`, and `skill-install`, clone the cache when missing and fetch when the user asks for latest or the cache marker is missing or older than `cacheTtlSeconds`. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. `cacheTtlSeconds: 0` disables automatic TTL refresh. `skill-update` and `skill-upload` always fetch before changing local state or creating PRs.

## Configuration File

`~/.skill-market/config.json` is the required configuration file for all Skill Market management skills: before any operation that reads the remote or cache, check it, and if it is missing, create it with the defaults below, then continue.

```json
{
  "repoUrl": "git@github.com:myqz-wld/skill-market.git",
  "cachePath": "~/.skill-market/cache/skill-market",
  "cacheTtlSeconds": 86400
}
```

Field reference:

- `repoUrl`: the remote source-of-truth repository; env override `SKILL_MARKET_REPO_URL`.
- `cachePath`: the local cache working copy location; env override `SKILL_MARKET_CACHE`.
- `cacheTtlSeconds`: cache freshness TTL in seconds for list, search, download, and install; `0` disables automatic TTL refresh; env override `SKILL_MARKET_CACHE_TTL_SECONDS`.
- `repoPath` (optional): explicit local development repository override; bypasses cache TTL; env override `SKILL_MARKET_REPO`. Never default to the current directory.

Precedence: environment variable > config file field > built-in default.

When this skill runs, or whenever the user asks about Skill Market configuration, read the current `~/.skill-market/config.json` and the four environment variables, then explain each field to the user with its current effective value and where that value comes from (env override, config file, or default). Flag unknown fields and invalid values (for example a non-numeric `cacheTtlSeconds`) instead of silently ignoring them.

## Storage

- Bootstrap management skills live inside `plugins/skill-market-claude/skills/`.
- Managed standalone Claude skills live under `skills/claude/`.
- Claude plugins are listed in `.claude-plugin/marketplace.json` and live under `plugins/`.

Upload is not publish. A skill or plugin is published only after its PR is merged.

`skills/INDEX.md` is the remote skill catalog index and records each standalone skill's catalog `Version`, status, path, and description. Local Claude management state lives in `~/.skill-market/managed-skills.json` and records each installed standalone skill's `installedVersion`.

Only skills installed through Skill Market or explicitly adopted by the user are managed. Do not list unrelated local Claude skills. If a requested operation touches a local skill absent from `managed-skills.json`, ask the user before adopting or modifying it.
