---
name: skill-download
description: Download a Claude Skill Market plugin or standalone Claude skill package without installing or changing local state.
disable-model-invocation: true
---

# Skill Download for Claude

Use this skill when the user wants a Skill Market package exported without installing it or changing local Claude state.

## Repository Source

Use remote `repoUrl` as the source of truth, defaulting to `git@github.com:myqz-wld/skill-market.git`. Use cache path `~/.skill-market/cache/skill-market` by default. `SKILL_MARKET_REPO_URL`, `SKILL_MARKET_CACHE`, `SKILL_MARKET_CACHE_TTL_SECONDS`, and `~/.skill-market/config.json` fields `repoUrl` / `cachePath` / `cacheTtlSeconds` override those defaults. `repoPath` is only an explicit local development override.

For download, clone the cache when missing. Fetch when the user asks for the latest package or the cache marker is missing or older than `cacheTtlSeconds`; default TTL is `86400` seconds. `cacheTtlSeconds: 0` disables automatic TTL refresh. After clone or fetch, write `<cachePath>/.skill-market-cache.json` with `repoUrl`, `fetchedAt`, and `head`. If fetch fails and cache exists, use the stale cache and report that it may be stale.

## Download

- Plugin package: copy or archive `plugins/<plugin-name>/`.
- Standalone Claude skill package: copy or archive `skills/claude/<skill-name>/`.

If the user does not provide a destination, copy to `~/.skill-market/downloads/claude/<name>/`.

Download never installs or updates local Claude state. Do not overwrite an existing destination unless the user explicitly asks.
