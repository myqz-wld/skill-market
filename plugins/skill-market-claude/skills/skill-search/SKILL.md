---
name: skill-search
description: Search the remote Skill Market catalog for Claude plugins and standalone Claude skills without installing anything.
disable-model-invocation: true
---

# Skill Search for Claude

Use this skill when the user wants to find Claude catalog entries without installing or changing local state.

## Repository Source

Use the remote repository as the source of truth:

1. `SKILL_MARKET_REPO_URL` environment variable.
2. `~/.skill-market/config.json` field `repoUrl`.
3. Default: `git@github.com:myqz-wld/skill-market.git`.

Use the local cache only as a working copy:

1. `SKILL_MARKET_CACHE` environment variable.
2. `~/.skill-market/config.json` field `cachePath`.
3. Default: `~/.skill-market/cache/skill-market`.

Only use `SKILL_MARKET_REPO` or config field `repoPath` when the user explicitly wants a local development checkout. Do not treat the current directory as the default repository. `~/.skill-market/config.json` is required: if it is missing, create it with the default `repoUrl`, `cachePath`, and `cacheTtlSeconds` values before continuing.

For search, clone the cache when missing. Fetch when the user asks for latest results or the cache marker is missing or older than `cacheTtlSeconds`. TTL comes from `SKILL_MARKET_CACHE_TTL_SECONDS`, config field `cacheTtlSeconds`, then default `86400` seconds. `cacheTtlSeconds: 0` disables automatic TTL refresh. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## Search Targets

- Claude plugins: `.claude-plugin/marketplace.json` and `plugins/`.
- Standalone Claude skills: `skills/INDEX.md` and `skills/claude/`.

Return matches with type, adapter, name, version, repository path, and a short description.
