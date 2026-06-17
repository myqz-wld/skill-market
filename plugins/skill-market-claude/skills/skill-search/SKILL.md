---
name: skill-search
description: Search the remote Skill Market catalog for Claude plugins and standalone Claude skills without installing anything.
disable-model-invocation: true
---

# Skill Search for Claude

Use this skill when the user wants to find Claude catalog entries without installing or changing local state.

## Repository Source

Before reading the catalog or cache:

- Ensure `~/.skill-market/config.json` exists; if missing, create it with default `repoUrl: git@github.com:myqz-wld/skill-market.git`, `cachePath: ~/.skill-market/cache/skill-market`, and `cacheTtlSeconds: 86400`.
- Resolve settings as environment variable > config field > default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, and `SKILL_MARKET_CACHE_TTL_SECONDS` map to `repoUrl`, `cachePath`, and `cacheTtlSeconds`.
- Use `repoUrl` as the source of truth and `cachePath` only as a working copy. Use `SKILL_MARKET_REPO` or config `repoPath` only when the user explicitly chooses a local development checkout; never default to the current directory. When selected, read that checkout directly and skip cache clone, fetch, markers, and TTL.
- Without `repoPath`, clone the cache when missing. Fetch when the user asks for latest results or `<cachePath>/.skill-market-cache.json` is missing or older than `cacheTtlSeconds`; `0` disables automatic TTL refresh.
- After clone or fetch, write the cache marker with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## Search Targets

- Claude plugins: `.claude-plugin/marketplace.json` and `plugins/`.
- Standalone Claude skills: `skills/INDEX.md` and `skills/claude/`.

Return matches with type, adapter, name, version, repository path, and a short description.
