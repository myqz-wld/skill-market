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

Configuration overrides:

- `SKILL_MARKET_REPO_URL` or `~/.skill-market/config.json` field `repoUrl`.
- `SKILL_MARKET_CACHE` or `~/.skill-market/config.json` field `cachePath`.
- `SKILL_MARKET_CACHE_TTL_SECONDS` or config field `cacheTtlSeconds`; default `86400` seconds.
- `SKILL_MARKET_REPO` or config field `repoPath` only for explicit local development.

Do not treat the current directory as the default repository.

For `skill-list`, `skill-search`, `skill-download`, and `skill-install`, clone the cache when missing and fetch when the user asks for latest or the cache marker is missing or older than `cacheTtlSeconds`. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. `cacheTtlSeconds: 0` disables automatic TTL refresh. `skill-update` and `skill-upload` always fetch before changing local state or creating PRs.

## Storage

- Bootstrap management skills live inside `plugins/skill-market-claude/skills/`.
- Managed standalone Claude skills live under `skills/claude/`.
- Claude plugins are listed in `.claude-plugin/marketplace.json` and live under `plugins/`.

Upload is not publish. A skill or plugin is published only after its PR is merged.

`skills/INDEX.md` is the remote skill catalog index and records each standalone skill's catalog `Version`, status, path, and description. Local Claude management state lives in `~/.skill-market/managed-skills.json` and records each installed standalone skill's `installedVersion`.

Only skills installed through Skill Market or explicitly adopted by the user are managed. Do not list unrelated local Claude skills. If a requested operation touches a local skill absent from `managed-skills.json`, ask the user before adopting or modifying it.
